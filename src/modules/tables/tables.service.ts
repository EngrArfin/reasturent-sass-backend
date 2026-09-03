import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantTableDto, TableStatusEnum } from './dto/create-table.dto';
import { UpdateRestaurantTableDto } from './dto/update-table.dto';
import { QueryRestaurantTableDto } from './dto/query-table.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class TablesService {
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

  async create(createDto: CreateRestaurantTableDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createDto.businessId);

    const existing = await this.prisma.restaurantTable.findFirst({
      where: {
        tableNumber: createDto.tableNumber.trim(),
        businessId: businessId!,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Table with number "${createDto.tableNumber}" already exists in this restaurant`,
      );
    }

    const table = await this.prisma.restaurantTable.create({
      data: {
        tableNumber: createDto.tableNumber.trim(),
        capacity: createDto.capacity,
        section: createDto.section,
        status: (createDto.status as any) || 'AVAILABLE',
        subStatus: createDto.subStatus || (createDto.status === TableStatusEnum.OCCUPIED ? 'SERVED' : null),
        businessId: businessId!,
      },
    });

    return {
      success: true,
      message: 'Table created successfully',
      data: table,
    };
  }

  async findAll(query: QueryRestaurantTableDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, query.businessId, false);

    const where: any = { isActive: true };
    if (businessId) {
      where.businessId = businessId;
    }

    if (query.status && query.status.toUpperCase() !== 'ALL') {
      where.status = query.status.toUpperCase();
    }

    if (query.section && query.section.toUpperCase() !== 'ALL') {
      where.section = { contains: query.section, mode: 'insensitive' };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { tableNumber: { contains: term, mode: 'insensitive' } },
        { capacity: { contains: term, mode: 'insensitive' } },
        { section: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const baseWhere = businessId ? { businessId, isActive: true } : { isActive: true };

    const [totalTables, occupiedCount, availableCount, reservedCount, total, items] =
      await Promise.all([
        this.prisma.restaurantTable.count({ where: baseWhere }),
        this.prisma.restaurantTable.count({
          where: { ...baseWhere, status: 'OCCUPIED' as any },
        }),
        this.prisma.restaurantTable.count({
          where: { ...baseWhere, status: 'AVAILABLE' as any },
        }),
        this.prisma.restaurantTable.count({
          where: { ...baseWhere, status: 'RESERVED' as any },
        }),
        this.prisma.restaurantTable.count({ where }),
        this.prisma.restaurantTable.findMany({
          where,
          include: {
            orders: {
              where: {
                status: {
                  in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any, 'SERVED' as any],
                },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { tableNumber: 'asc' },
          skip,
          take: limit,
        }),
      ]);

    const formattedItems = items.map((table) => {
      const activeOrder = table.orders?.[0];
      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        section: table.section,
        status: table.status,
        subStatus: table.subStatus || (activeOrder ? activeOrder.status : '-'),
        activeOrderId: activeOrder?.id || null,
        activeOrderNumber: activeOrder?.orderNumber || null,
        createdAt: table.createdAt,
      };
    });

    return {
      success: true,
      summary: {
        total: totalTables,
        occupied: occupiedCount,
        available: availableCount,
        reserved: reservedCount,
      },
      data: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getSummary(user: any, requestedBusinessId?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId, false);
    const where: any = { isActive: true };
    if (businessId) {
      where.businessId = businessId;
    }

    const [total, occupied, available, reserved] = await Promise.all([
      this.prisma.restaurantTable.count({ where }),
      this.prisma.restaurantTable.count({ where: { ...where, status: 'OCCUPIED' as any } }),
      this.prisma.restaurantTable.count({ where: { ...where, status: 'AVAILABLE' as any } }),
      this.prisma.restaurantTable.count({ where: { ...where, status: 'RESERVED' as any } }),
    ]);

    return {
      success: true,
      data: {
        total,
        occupied,
        available,
        reserved,
      },
    };
  }

  async findOne(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
      include: {
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    return {
      success: true,
      data: table,
    };
  }

  async update(id: string, updateDto: UpdateRestaurantTableDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    const updated = await this.prisma.restaurantTable.update({
      where: { id },
      data: {
        tableNumber: updateDto.tableNumber,
        capacity: updateDto.capacity,
        section: updateDto.section,
        status: updateDto.status ? (updateDto.status as any) : undefined,
        subStatus: updateDto.subStatus !== undefined ? updateDto.subStatus : undefined,
      },
    });

    return {
      success: true,
      message: 'Table updated successfully',
      data: updated,
    };
  }

  async remove(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    const activeOrdersCount = await this.prisma.order.count({
      where: {
        tableId: id,
        status: {
          in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any, 'SERVED' as any],
        },
      },
    });

    if (activeOrdersCount > 0) {
      throw new BadRequestException(
        `Cannot delete table "${table.tableNumber}" while active orders are ongoing. Please complete or cancel active orders first.`,
      );
    }

    await this.prisma.restaurantTable.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Table deleted successfully',
    };
  }
}
