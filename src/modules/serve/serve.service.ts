import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServeOrderDto } from './dto/create-serve-order.dto';
import { UpdateServeTableStatusDto } from './dto/update-serve-table.dto';
import {
  UpdateServeOrderStatusDto,
  ServeOrderStatusEnum,
} from './dto/update-serve-order-status.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class ServeService {
  constructor(private readonly prisma: PrismaService) {}

  private getEffectiveBusinessId(user: any): string {
    const businessId = user?.businessId;
    if (!businessId && user?.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('User is not associated with any restaurant business');
    }
    return businessId;
  }

  // 1. Get Table Map View Data
  async getTableMap(user: any) {
    const businessId = this.getEffectiveBusinessId(user);
    const where = businessId ? { businessId, isActive: true } : { isActive: true };

    const tables = await this.prisma.restaurantTable.findMany({
      where,
      orderBy: { tableNumber: 'asc' },
    });

    const total = tables.length;
    const occupied = tables.filter((t) => t.status === 'OCCUPIED').length;
    const available = tables.filter((t) => t.status === 'AVAILABLE').length;
    const reserved = tables.filter((t) => t.status === 'RESERVED').length;

    return {
      success: true,
      summary: {
        total,
        occupied,
        available,
        reserved,
      },
      data: tables.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        capacity: t.capacity || '4 Seat',
        section: t.section || 'Main Hall',
        status: t.status,
        subStatus: t.subStatus,
      })),
    };
  }

  // 2. Update Table Status directly from Table Map
  async updateTableStatus(
    tableId: string,
    dto: UpdateServeTableStatusDto,
    user: any,
  ) {
    const businessId = this.getEffectiveBusinessId(user);

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        id: tableId,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!table) {
      throw new NotFoundException(`Table #${tableId} not found`);
    }

    const updated = await this.prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status: dto.status as any,
        subStatus: dto.subStatus ?? (dto.status === 'AVAILABLE' ? null : table.subStatus),
      },
    });

    return {
      success: true,
      message: `Table status updated to ${updated.status}`,
      data: updated,
    };
  }

  // 3. Get Menu Items for Table Menu Modal
  async getMenuItems(user: any) {
    const businessId = this.getEffectiveBusinessId(user);
    const where = businessId
      ? { businessId, isAvailable: true, isActive: true }
      : { isAvailable: true, isActive: true };

    const items = await this.prisma.menuItem.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    return {
      success: true,
      data: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        category: i.category,
        price: Number(i.price),
        imageUrl: i.imageUrl || '',
        isAvailable: i.isAvailable,
      })),
    };
  }

  // 4. Send Order To Kitchen
  async sendOrderToKitchen(dto: CreateServeOrderDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Find table if tableId or tableNumber provided
    let table: any = null;
    if (dto.tableId) {
      table = await this.prisma.restaurantTable.findFirst({
        where: { id: dto.tableId, ...(businessId ? { businessId } : {}) },
      });
    } else if (dto.tableNumber) {
      table = await this.prisma.restaurantTable.findFirst({
        where: { tableNumber: dto.tableNumber, ...(businessId ? { businessId } : {}) },
      });
    }

    // Generate Ticket / Order Number (e.g. 8-character hex ticket ID like 941862f1)
    const ticketId = Math.random().toString(16).substring(2, 10);
    const orderNumber = ticketId;

    let calculatedTotal = 0;
    const itemsData = dto.items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.unitPrice) || 0);
      const total = Number((qty * price).toFixed(2));
      calculatedTotal += total;

      return {
        menuItemId: item.menuItemId || null,
        name: item.name,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: item.notes || null,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        tableId: table ? table.id : dto.tableId || null,
        tableNumber: dto.tableNumber || (table ? table.tableNumber : '1'),
        status: 'PENDING',
        totalBill: Number(calculatedTotal.toFixed(2)),
        notes: dto.notes || null,
        businessId: businessId!,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Mark table as OCCUPIED
    if (table) {
      await this.prisma.restaurantTable.update({
        where: { id: table.id },
        data: {
          status: 'OCCUPIED',
          subStatus: 'ORDER_IN_KITCHEN',
        },
      }).catch(() => null);
    }

    return {
      success: true,
      message: `Order #${order.orderNumber} sent to kitchen successfully`,
      data: {
        id: order.id,
        ticketId: order.orderNumber,
        tableNumber: order.tableNumber,
        status: 'In Kitchen',
        totalBill: order.totalBill,
        items: order.items,
        createdAt: order.createdAt,
      },
    };
  }

  // 5. Get Table Order Status List (Order Status Tab)
  async getTableOrderStatuses(user: any, statusFilter?: string) {
    const businessId = this.getEffectiveBusinessId(user);
    const where: any = businessId ? { businessId } : {};

    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      where.status = statusFilter.toUpperCase();
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formattedOrders = orders.map((o) => {
      const date = new Date(o.createdAt);
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      let displayStatus = 'In Kitchen';
      switch (o.status) {
        case 'PENDING':
          displayStatus = 'Confirmed';
          break;
        case 'PREPARING':
          displayStatus = 'In Kitchen';
          break;
        case 'READY':
          displayStatus = 'Ready to Serve';
          break;
        case 'SERVED':
          displayStatus = 'Served';
          break;
        case 'CANCELLED':
          displayStatus = 'Cancelled';
          break;
      }

      return {
        id: o.id,
        ticketId: o.orderNumber,
        tableNumber: o.tableNumber || (o.table ? o.table.tableNumber : '1'),
        time: timeStr,
        status: displayStatus,
        rawStatus: o.status,
        totalBill: Number(o.totalBill),
        items: o.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          tags: i.notes ? i.notes.split(',').map((t) => t.trim()).filter(Boolean) : [],
        })),
        createdAt: o.createdAt,
      };
    });

    return {
      success: true,
      count: formattedOrders.length,
      data: formattedOrders,
    };
  }

  // 6. Update Order Ticket Status (e.g. Confirmed, In Kitchen, Ready to Serve, Served, Cancelled)
  async updateOrderStatus(
    orderId: string,
    dto: UpdateServeOrderStatusDto,
    user: any,
  ) {
    const businessId = this.getEffectiveBusinessId(user);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ticket not found`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as any },
      include: { items: true },
    });

    // Sync Table status
    if (order.tableId) {
      if (
        dto.status === ServeOrderStatusEnum.CANCELLED ||
        dto.status === ServeOrderStatusEnum.COMPLETED
      ) {
        const otherActive = await this.prisma.order.count({
          where: {
            tableId: order.tableId,
            status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] },
            id: { not: orderId },
          },
        });

        if (otherActive === 0) {
          await this.prisma.restaurantTable.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE', subStatus: null },
          }).catch(() => null);
        }
      } else if (dto.status === ServeOrderStatusEnum.SERVED) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'OCCUPIED', subStatus: 'SERVED' },
        }).catch(() => null);
      }
    }

    return {
      success: true,
      message: `Order ticket updated to ${updated.status}`,
      data: updated,
    };
  }
}
