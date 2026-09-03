import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, OrderStatusEnum } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class OrdersService {
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

  private async generateOrderNumber(businessId: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { businessId } });
    const baseNumber = 9020 + count + 1;
    return `ORD-${baseNumber}`;
  }

  private getActionButton(status: string): { label: string; nextStatus: string } | null {
    switch (status) {
      case 'PENDING':
        return { label: 'Start Prep', nextStatus: 'PREPARING' };
      case 'PREPARING':
      case 'READY':
        return { label: 'Mark Served', nextStatus: 'SERVED' };
      case 'SERVED':
        return { label: 'Complete Bill', nextStatus: 'COMPLETED' };
      default:
        return null;
    }
  }

  async create(createDto: CreateOrderDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createDto.businessId);

    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one dish or item');
    }

    let tableNumber = createDto.tableNumber;
    if (createDto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({
        where: {
          id: createDto.tableId,
          businessId: businessId!,
          isActive: true,
        },
      });
      if (!table) {
        throw new NotFoundException(`Table with ID "${createDto.tableId}" not found in this restaurant`);
      }
      if (!tableNumber) {
        tableNumber = `Table #${table.tableNumber}`;
      }
    }

    const orderNumber =
      createDto.orderNumber || (await this.generateOrderNumber(businessId!));

    const initialStatus = createDto.status || OrderStatusEnum.PENDING;

    let calculatedTotal = 0;
    const itemsData = createDto.items.map((item, index) => {
      const name = (item.name || '').trim();
      if (!name) {
        throw new BadRequestException(`Item at index ${index} must have a valid name`);
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new BadRequestException(`Item "${name}" must have a quantity of at least 1`);
      }
      const price = Number(item.unitPrice);
      if (isNaN(price) || price < 0) {
        throw new BadRequestException(`Item "${name}" must have a valid unit price`);
      }
      const total = Number((qty * price).toFixed(2));
      calculatedTotal += total;

      return {
        menuItemId: item.menuItemId || null,
        name,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: item.notes || null,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        tableId: createDto.tableId || null,
        tableNumber: tableNumber || 'Takeaway',
        status: initialStatus as any,
        totalBill: Number(calculatedTotal.toFixed(2)),
        notes: createDto.notes,
        businessId: businessId!,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    if (createDto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: createDto.tableId },
        data: {
          status: 'OCCUPIED' as any,
          subStatus: initialStatus === OrderStatusEnum.SERVED ? 'SERVED' : 'ORDER_PLACED',
        },
      }).catch(() => null);
    }

    const action = this.getActionButton(order.status);

    return {
      success: true,
      message: 'Order created successfully',
      data: {
        ...order,
        actionButton: action?.label || null,
        nextStatus: action?.nextStatus || null,
      },
    };
  }

  async findAll(query: QueryOrderDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, query.businessId, false);

    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }

    if (query.status && query.status.toUpperCase() !== 'ALL') {
      where.status = query.status.toUpperCase();
    }

    if (query.tableId) {
      where.tableId = query.tableId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { tableNumber: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const baseWhere = businessId ? { businessId } : {};

    const [totalOrders, pendingCount, preparingCount, servedCount, completedCount, total, items] =
      await Promise.all([
        this.prisma.order.count({ where: baseWhere }),
        this.prisma.order.count({ where: { ...baseWhere, status: 'PENDING' as any } }),
        this.prisma.order.count({ where: { ...baseWhere, status: 'PREPARING' as any } }),
        this.prisma.order.count({ where: { ...baseWhere, status: 'SERVED' as any } }),
        this.prisma.order.count({ where: { ...baseWhere, status: 'COMPLETED' as any } }),
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          include: {
            items: true,
            table: {
              select: {
                id: true,
                tableNumber: true,
                section: true,
                capacity: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

    const formattedItems = items.map((order) => {
      const action = this.getActionButton(order.status);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableNumber: order.tableNumber || (order.table ? `Table #${order.table.tableNumber}` : 'Takeaway'),
        status: order.status,
        totalBill: Number(order.totalBill),
        formattedTotal: `$${Number(order.totalBill).toFixed(2)}`,
        notes: order.notes,
        actionButton: action?.label || null,
        nextStatus: action?.nextStatus || null,
        items: order.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
          formattedTotalPrice: `$${Number(i.totalPrice).toFixed(2)}`,
          notes: i.notes,
        })),
        createdAt: order.createdAt,
      };
    });

    return {
      success: true,
      summary: {
        total: totalOrders,
        pending: pendingCount,
        preparing: preparingCount,
        served: servedCount,
        completed: completedCount,
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
    const where: any = businessId ? { businessId } : {};

    const [total, pending, preparing, served, completed] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'PENDING' as any } }),
      this.prisma.order.count({ where: { ...where, status: 'PREPARING' as any } }),
      this.prisma.order.count({ where: { ...where, status: 'SERVED' as any } }),
      this.prisma.order.count({ where: { ...where, status: 'COMPLETED' as any } }),
    ]);

    return {
      success: true,
      data: {
        total,
        pending,
        preparing,
        served,
        completed,
      },
    };
  }

  async findOne(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
      include: {
        items: true,
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    const action = this.getActionButton(order.status);

    return {
      success: true,
      data: {
        ...order,
        actionButton: action?.label || null,
        nextStatus: action?.nextStatus || null,
        formattedTotal: `$${Number(order.totalBill).toFixed(2)}`,
      },
    };
  }

  async updateStatus(id: string, statusDto: UpdateOrderStatusDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    const newStatus = statusDto.status;

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus as any },
      include: { items: true },
    });

    if (order.tableId) {
      if (newStatus === OrderStatusEnum.COMPLETED || newStatus === OrderStatusEnum.CANCELLED) {
        const remainingActive = await this.prisma.order.count({
          where: {
            tableId: order.tableId,
            status: { in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any, 'SERVED' as any] },
            id: { not: id },
          },
        });

        if (remainingActive === 0) {
          await this.prisma.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: 'AVAILABLE' as any,
              subStatus: null,
            },
          }).catch(() => null);
        }
      } else if (newStatus === OrderStatusEnum.SERVED) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: {
            status: 'OCCUPIED' as any,
            subStatus: 'SERVED',
          },
        }).catch(() => null);
      } else if (newStatus === OrderStatusEnum.PREPARING) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: {
            status: 'OCCUPIED' as any,
            subStatus: 'PREPARING',
          },
        }).catch(() => null);
      }
    }

    const action = this.getActionButton(updated.status);

    return {
      success: true,
      message: `Order status updated to ${updated.status}`,
      data: {
        ...updated,
        actionButton: action?.label || null,
        nextStatus: action?.nextStatus || null,
      },
    };
  }

  async update(id: string, updateDto: UpdateOrderDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    let calculatedTotal = order.totalBill;

    if (updateDto.items && updateDto.items.length > 0) {
      await this.prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      calculatedTotal = 0;
      const itemsData = updateDto.items.map((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const price = Math.max(0, Number(item.unitPrice) || 0);
        const total = Number((qty * price).toFixed(2));
        calculatedTotal += total;

        return {
          orderId: id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          notes: item.notes || null,
        };
      });

      await this.prisma.orderItem.createMany({
        data: itemsData,
      });
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        tableNumber: updateDto.tableNumber,
        notes: updateDto.notes,
        status: updateDto.status ? (updateDto.status as any) : undefined,
        totalBill: Number(calculatedTotal.toFixed(2)),
      },
      include: { items: true },
    });

    const action = this.getActionButton(updated.status);

    return {
      success: true,
      message: 'Order updated successfully',
      data: {
        ...updated,
        actionButton: action?.label || null,
        nextStatus: action?.nextStatus || null,
      },
    };
  }

  async remove(id: string, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  }
}
