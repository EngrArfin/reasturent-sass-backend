import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, StockStatusFilter } from './dto/query-product.dto';
import { UpdateStockDto, StockAdjustmentType } from './dto/update-stock.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private getEffectiveBusinessId(user: any, requestedBusinessId?: string): string {
    if (user.role === UserRole.SUPER_ADMIN && requestedBusinessId) {
      return requestedBusinessId;
    }
    const businessId = user.businessId;
    if (!businessId) {
      throw new BadRequestException('Current user is not associated with any business tenant');
    }
    return businessId;
  }

  async generateSku(user: any, requestedBusinessId?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, businessName: true },
    });

    const count = await this.prisma.product.count({
      where: { businessId },
    });

    // Generate prefix e.g. RENE or first 4 letters of business name
    let prefix = 'RENE';
    if (business && business.businessName) {
      const cleanName = business.businessName.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (cleanName.length >= 3) {
        prefix = cleanName.substring(0, 4);
      }
    }

    let codeNumber = 1001 + count;
    let generatedCode = `${prefix}-${codeNumber}`;

    // Ensure uniqueness
    let exists = await this.prisma.product.findFirst({
      where: { businessId, OR: [{ barcode: generatedCode }, { sku: generatedCode }] },
    });

    while (exists) {
      codeNumber += 1;
      generatedCode = `${prefix}-${codeNumber}`;
      exists = await this.prisma.product.findFirst({
        where: { businessId, OR: [{ barcode: generatedCode }, { sku: generatedCode }] },
      });
    }

    return {
      barcode: generatedCode,
      sku: generatedCode,
    };
  }

  async create(createProductDto: CreateProductDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createProductDto.businessId);

    let barcode = createProductDto.barcode?.trim();
    let sku = createProductDto.sku?.trim();

    if (!barcode && !sku) {
      const generated = await this.generateSku(user, businessId);
      barcode = generated.barcode;
      sku = generated.sku;
    } else {
      barcode = barcode || sku!;
      sku = sku || barcode;
    }

    // Check if barcode already exists within the same business
    const existing = await this.prisma.product.findFirst({
      where: {
        businessId,
        OR: [{ barcode }, { sku }],
      },
    });

    if (existing) {
      throw new ConflictException(`A product with Barcode or SKU "${barcode}" already exists in this business`);
    }

    const stock = createProductDto.stock ?? createProductDto.initialStock ?? 0;

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name.trim(),
        barcode,
        sku,
        stock: Math.max(0, Math.floor(stock)),
        price: Number(createProductDto.price),
        businessId,
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
      },
    });

    return product;
  }

  async findAll(query: QueryProductDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, query.businessId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      businessId,
    };

    if (query.search && query.search.trim() !== '') {
      const searchKeyword = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { barcode: { contains: searchKeyword, mode: 'insensitive' } },
        { sku: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    if (query.stockStatus) {
      if (query.stockStatus === StockStatusFilter.IN_STOCK) {
        whereClause.stock = { gt: 0 };
      } else if (query.stockStatus === StockStatusFilter.LOW_STOCK) {
        whereClause.stock = { gt: 0, lte: 5 };
      } else if (query.stockStatus === StockStatusFilter.OUT_OF_STOCK) {
        whereClause.stock = { equals: 0 };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where: whereClause }),
      this.prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((product) => ({
      ...product,
      stockStatus:
        product.stock <= 0
          ? 'OUT_OF_STOCK'
          : product.stock <= 5
          ? 'LOW_STOCK'
          : 'IN_STOCK',
      formattedPrice: `$${product.price.toFixed(2)}`,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string, user: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && product.businessId !== user.businessId) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return {
      ...product,
      stockStatus:
        product.stock <= 0
          ? 'OUT_OF_STOCK'
          : product.stock <= 5
          ? 'LOW_STOCK'
          : 'IN_STOCK',
      formattedPrice: `$${product.price.toFixed(2)}`,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: any) {
    const existing = await this.findOne(id, user);

    const dataToUpdate: any = {};

    if (updateProductDto.name !== undefined) {
      dataToUpdate.name = updateProductDto.name.trim();
    }

    if (updateProductDto.price !== undefined) {
      dataToUpdate.price = Number(updateProductDto.price);
    }

    if (updateProductDto.stock !== undefined || updateProductDto.initialStock !== undefined) {
      const newStock = updateProductDto.stock ?? updateProductDto.initialStock;
      dataToUpdate.stock = Math.max(0, Math.floor(Number(newStock)));
    }

    if (updateProductDto.isActive !== undefined) {
      dataToUpdate.isActive = updateProductDto.isActive;
    }

    const newBarcode = updateProductDto.barcode?.trim() || updateProductDto.sku?.trim();
    if (newBarcode && newBarcode !== existing.barcode) {
      const duplicate = await this.prisma.product.findFirst({
        where: {
          businessId: existing.businessId,
          id: { not: id },
          OR: [{ barcode: newBarcode }, { sku: newBarcode }],
        },
      });
      if (duplicate) {
        throw new ConflictException(`Barcode or SKU "${newBarcode}" is already in use by another product`);
      }
      dataToUpdate.barcode = newBarcode;
      dataToUpdate.sku = updateProductDto.sku?.trim() || newBarcode;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    return {
      ...updated,
      stockStatus:
        updated.stock <= 0
          ? 'OUT_OF_STOCK'
          : updated.stock <= 5
          ? 'LOW_STOCK'
          : 'IN_STOCK',
      formattedPrice: `$${updated.price.toFixed(2)}`,
    };
  }

  async updateStock(id: string, updateStockDto: UpdateStockDto, user: any) {
    const product = await this.findOne(id, user);

    let newStock = product.stock;
    const qty = Math.floor(Number(updateStockDto.quantity));

    switch (updateStockDto.type) {
      case StockAdjustmentType.ADD:
        newStock += qty;
        break;
      case StockAdjustmentType.SUBTRACT:
        newStock -= qty;
        break;
      case StockAdjustmentType.SET:
      default:
        newStock = qty;
        break;
    }

    if (newStock < 0) {
      throw new BadRequestException(`Cannot adjust stock below zero. Current stock is ${product.stock}, attempted deduction of ${qty}`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    return {
      ...updated,
      stockStatus:
        updated.stock <= 0
          ? 'OUT_OF_STOCK'
          : updated.stock <= 5
          ? 'LOW_STOCK'
          : 'IN_STOCK',
      formattedPrice: `$${updated.price.toFixed(2)}`,
      previousStock: product.stock,
      adjustedStock: updated.stock,
      adjustmentType: updateStockDto.type || StockAdjustmentType.SET,
    };
  }

  async remove(id: string, user: any) {
    const product = await this.findOne(id, user);

    await this.prisma.product.delete({
      where: { id: product.id },
    });

    return {
      message: `Product "${product.name}" (${product.barcode || product.sku}) deleted successfully`,
      id: product.id,
      name: product.name,
      barcode: product.barcode,
    };
  }

  async getBarcodeLabel(id: string, user: any) {
    const product = await this.findOne(id, user);

    return {
      productId: product.id,
      productName: product.name,
      barcode: product.barcode || product.sku,
      sku: product.sku || product.barcode,
      price: product.price,
      formattedPrice: `$${product.price.toFixed(2)}`,
      stock: product.stock,
      businessName: product.business?.businessName || 'Restaurant',
      printLabelData: {
        text: product.name,
        code: product.barcode || product.sku,
        priceTag: `$${product.price.toFixed(2)}`,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getSummary(user: any, requestedBusinessId?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId);

    const products = await this.prisma.product.findMany({
      where: { businessId },
      select: { stock: true, price: true },
    });

    const totalProducts = products.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalInventoryValue = 0;

    for (const p of products) {
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= 5) {
        lowStockCount++;
        inStockCount++;
      } else {
        inStockCount++;
      }
      totalInventoryValue += p.stock * p.price;
    }

    return {
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      currency: 'USD',
    };
  }
}
