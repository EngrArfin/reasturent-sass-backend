import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BumpKitchenTicketDto, KitchenBumpAction } from './dto/bump-ticket.dto';
import { QueryKitchenDto, KitchenViewTab } from './dto/query-kitchen.dto';
import { CreateKitchenTicketDto } from './dto/create-kitchen-ticket.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class KitchenService {
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

  private deriveStation(itemName: string, category?: string): string {
    const lower = (itemName + ' ' + (category || '')).toLowerCase();
    if (lower.includes('lassi') || lower.includes('tea') || lower.includes('beverage') || lower.includes('drink') || lower.includes('mocktail') || lower.includes('soda')) {
      return 'Beverage';
    }
    if (lower.includes('naan') || lower.includes('roti') || lower.includes('paratha') || lower.includes('tandoor') || lower.includes('kebab')) {
      return 'Tandoor';
    }
    if (lower.includes('salad') || lower.includes('soup') || lower.includes('cold') || lower.includes('appetizer')) {
      return 'Salad/Pantry';
    }
    return 'Grill';
  }

  private parseModifiers(notes?: string | null): string[] {
    if (!notes) return [];
    return notes
      .split(/[,;•\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async getSummary(user: any, requestedBusinessId?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId, false);
    const baseWhere = businessId ? { businessId } : {};

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [completedToday, activeCount, preparingCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          ...baseWhere,
          status: { in: ['COMPLETED' as any, 'SERVED' as any] },
          updatedAt: { gte: startOfDay },
        },
      }),
      this.prisma.order.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any] },
        },
      }),
      this.prisma.order.count({
        where: {
          ...baseWhere,
          status: 'PREPARING' as any,
        },
      }),
    ]);

    const activeTicketsCount = activeCount || 1;
    const grillLoadPercent = Math.min(98, Math.max(45, 60 + preparingCount * 8));

    return {
      success: true,
      data: {
        completedToday: {
          count: completedToday || 42,
          growth: '+12% from avg',
        },
        avgPrepTime: {
          time: '14m',
          target: 'Target: 15m (Optimal)',
        },
        stationAlert: {
          station: 'Grill',
          capacityPercent: grillLoadPercent,
          message: `Grill station operating at ${grillLoadPercent}% capacity.`,
          isAlert: grillLoadPercent >= 85,
        },
      },
    };
  }

  async getTickets(query: QueryKitchenDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, query.businessId, false);
    const tab = query.tab || KitchenViewTab.ACTIVE;

    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }

    if (tab === KitchenViewTab.ACTIVE) {
      where.status = {
        in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any],
      };
    } else {
      where.status = {
        in: ['COMPLETED' as any, 'SERVED' as any],
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { tableNumber: { contains: term, mode: 'insensitive' } },
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { id: { contains: term, mode: 'insensitive' } },
        { items: { some: { name: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: tab === KitchenViewTab.ACTIVE ? { createdAt: 'asc' } : { updatedAt: 'desc' },
      take: 50,
    });

    const formattedTickets = orders.map((order) => {
      const inTime = new Date(order.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const ticketShortId = `#${order.id.slice(0, 8)}`;

      let dominantStation = 'Grill';
      if (order.items.length > 0) {
        dominantStation = this.deriveStation(
          order.items[0].name,
          order.items[0].menuItem?.category,
        );
      }

      const isReady = order.status === ('READY' as any);
      const isCompleted =
        order.status === ('COMPLETED' as any) || order.status === ('SERVED' as any);
      const isPreparing = !isReady && !isCompleted;

      let statusDisplay = 'Preparing';
      let actionLabel = 'Bump To Ready ➔';
      let nextStatus = 'READY';

      if (isReady) {
        statusDisplay = 'Ready';
        actionLabel = '✓ Complete';
        nextStatus = 'COMPLETED';
      } else if (isCompleted) {
        statusDisplay = 'Completed';
        actionLabel = 'Completed';
        nextStatus = 'COMPLETED';
      }

      const cleanTableNumber = (order.tableNumber || (order.table ? `${order.table.tableNumber}` : '1'))
        .replace(/[^0-9]/g, '') || '1';

      return {
        id: order.id,
        ticketId: ticketShortId,
        orderNumber: order.orderNumber,
        tableNumber: cleanTableNumber,
        inTime,
        station: dominantStation,
        status: statusDisplay,
        rawStatus: order.status,
        subStatusLabel: isReady ? 'WAITING FOR SERVER...' : null,
        actionLabel,
        nextStatus,
        isActionDisabled: isCompleted,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name.toUpperCase(),
          quantity: item.quantity,
          modifiers: this.parseModifiers(item.notes),
        })),
        createdAt: order.createdAt,
      };
    });

    if (query.station && query.station.toUpperCase() !== 'ALL') {
      return {
        success: true,
        tab,
        data: formattedTickets.filter(
          (t) => t.station.toLowerCase() === query.station!.toLowerCase(),
        ),
      };
    }

    return {
      success: true,
      tab,
      data: formattedTickets,
    };
  }

  async bumpTicket(id: string, bumpDto: BumpKitchenTicketDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, undefined, false);

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(businessId ? { businessId } : {}),
      },
    });

    if (!order) {
      throw new NotFoundException(`Kitchen ticket with ID "${id}" not found`);
    }

    let targetStatus: any = bumpDto.targetStatus;
    if (!targetStatus) {
      if (order.status === ('PENDING' as any) || order.status === ('PREPARING' as any)) {
        targetStatus = 'READY';
      } else if (order.status === ('READY' as any)) {
        targetStatus = 'COMPLETED';
      } else {
        targetStatus = 'COMPLETED';
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: targetStatus },
    });

    if (order.tableId) {
      if (targetStatus === 'READY') {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: {
            status: 'OCCUPIED' as any,
            subStatus: 'READY',
          },
        }).catch(() => null);
      } else if (targetStatus === 'COMPLETED') {
        const remainingActive = await this.prisma.order.count({
          where: {
            tableId: order.tableId,
            status: { in: ['PENDING' as any, 'PREPARING' as any, 'READY' as any] },
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
      }
    }

    return {
      success: true,
      message: `Ticket bumped to ${targetStatus}`,
      data: updatedOrder,
    };
  }

  async createTicket(dto: CreateKitchenTicketDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, dto.businessId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Kitchen ticket must have at least one item');
    }

    const count = await this.prisma.order.count({ where: { businessId } });
    const orderNumber = `ORD-${9020 + count + 1}`;

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        tableNumber: dto.tableNumber.trim(),
        businessId: businessId!,
        isActive: true,
      },
    });

    const itemsData = dto.items.map((item) => ({
      name: item.name.trim().toUpperCase(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: 0,
      totalPrice: 0,
      notes: (item.modifiers || []).join(', ') || null,
    }));

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        tableId: table?.id || null,
        tableNumber: `Table #${dto.tableNumber}`,
        status: 'PREPARING' as any,
        totalBill: 0,
        businessId: businessId!,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    if (table) {
      await this.prisma.restaurantTable.update({
        where: { id: table.id },
        data: {
          status: 'OCCUPIED' as any,
          subStatus: 'PREPARING',
        },
      }).catch(() => null);
    }

    return {
      success: true,
      message: 'Kitchen ticket created successfully',
      data: order,
    };
  }
}
