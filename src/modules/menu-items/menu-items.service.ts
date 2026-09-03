import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private getEffectiveBusinessId(
    user: any,
    requestedBusinessId?: string,
    isRequired = true,
  ): string | undefined {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (requestedBusinessId) {
        return requestedBusinessId;
      }
      if (isRequired) {
        throw new BadRequestException('businessId is required for Super Admin');
      }
      return undefined;
    }

    const businessId = user.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with any restaurant business');
    }
    return businessId;
  }

  async create(createDto: CreateMenuItemDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createDto.businessId);

    const existing = await this.prisma.menuItem.findFirst({
      where: {
        name: { equals: createDto.name.trim(), mode: 'insensitive' },
        businessId: businessId!,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Menu dish "${createDto.name}" already exists in the catalog`,
      );
    }

    const menuItem = await this.prisma.menuItem.create({
      data: {
        name: createDto.name.trim(),
        description: createDto.description,
        category: createDto.category,
        price: Number(createDto.price),
        prepTime: createDto.prepTime || '15 mins',
        isAvailable: createDto.isAvailable ?? true,
        imageUrl: createDto.imageUrl,
        businessId: businessId!,
      },
    });

    return {
      success: true,
      message: 'Menu dish added successfully',
      data: {
        ...menuItem,
        availability: menuItem.isAvailable ? 'In Stock' : 'Out of Stock',
      },
    };
  }

  async findAll(query: QueryMenuItemDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, query.businessId, false);

    const where: any = { isActive: true };
    if (businessId) {
      where.businessId = businessId;
    }

    if (query.category && query.category.toUpperCase() !== 'ALL') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const baseWhere = businessId ? { businessId, isActive: true } : { isActive: true };

    const [allDishes, total, items] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: baseWhere,
        select: { category: true },
      }),
      this.prisma.menuItem.count({ where }),
      this.prisma.menuItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    const distinctCategories = Array.from(
      new Set(allDishes.map((d) => d.category).filter(Boolean)),
    );
    const defaultCategories = ['Main Course', 'Appetizer', 'Dessert', 'Beverage'];
    const categories = ['ALL', ...Array.from(new Set([...defaultCategories, ...distinctCategories]))];

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: Number(item.price),
      formattedPrice: `$${Number(item.price).toFixed(2)}`,
      prepTime: item.prepTime,
      isAvailable: item.isAvailable,
      availability: item.isAvailable ? 'In Stock' : 'Out of Stock',
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
    }));

    return {
      success: true,
      categories,
      data: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCategories(user: any, requestedBusinessId?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId, false);
    const where: any = { isActive: true };
    if (businessId) {
      where.businessId = businessId;
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      select: { category: true },
    });

    const categoryCounts: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      success: true,
      data: categoryCounts,
    };
  }

  async findOne(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }

    return {
      success: true,
      data: {
        ...item,
        formattedPrice: `$${Number(item.price).toFixed(2)}`,
        availability: item.isAvailable ? 'In Stock' : 'Out of Stock',
      },
    };
  }

  async update(id: string, updateDto: UpdateMenuItemDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        category: updateDto.category,
        price: updateDto.price !== undefined ? Number(updateDto.price) : undefined,
        prepTime: updateDto.prepTime,
        isAvailable: updateDto.isAvailable,
        imageUrl: updateDto.imageUrl,
      },
    });

    return {
      success: true,
      message: 'Menu dish updated successfully',
      data: {
        ...updated,
        formattedPrice: `$${Number(updated.price).toFixed(2)}`,
        availability: updated.isAvailable ? 'In Stock' : 'Out of Stock',
      },
    };
  }

  async toggleAvailability(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: !item.isAvailable,
      },
    });

    return {
      success: true,
      message: `Dish marked as ${updated.isAvailable ? 'In Stock' : 'Out of Stock'}`,
      data: {
        ...updated,
        availability: updated.isAvailable ? 'In Stock' : 'Out of Stock',
      },
    };
  }

  async remove(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }

    await this.prisma.menuItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Menu item deleted successfully',
    };
  }
}
