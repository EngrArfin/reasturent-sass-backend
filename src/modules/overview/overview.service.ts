import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewCards(user: any, requestedBusinessId?: string) {
    let businessId = user?.businessId;
    if (user?.role === UserRole.SUPER_ADMIN && requestedBusinessId) {
      businessId = requestedBusinessId;
    }

    let business: any = null;
    if (businessId) {
      business = await this.prisma.business.findUnique({
        where: { id: businessId },
        include: {
          _count: {
            select: {
              users: true,
              products: true,
              tickets: true,
              vouchers: true,
            },
          },
        },
      });
    } else if (user?.role === UserRole.SUPER_ADMIN) {
      business = await this.prisma.business.findFirst({
        include: {
          _count: {
            select: {
              users: true,
              products: true,
              tickets: true,
              vouchers: true,
            },
          },
        },
      });
      businessId = business?.id;
    }

    if (!business) {
      throw new BadRequestException('No restaurant tenant associated with this account');
    }

    const settings = (business.settings as any) || {};
    const overviewSettings = settings.overview || {};

    const dailySales =
      overviewSettings.dailySales !== undefined
        ? Number(overviewSettings.dailySales)
        : 4280.50;
    const dailySalesBadge = overviewSettings.dailySalesChange || '+12';

    const totalTransactions =
      overviewSettings.totalTransactions !== undefined
        ? Number(overviewSettings.totalTransactions)
        : 142;
    const totalTransactionsBadge = overviewSettings.totalTransactionsChange || '+5.2%';

    const activeTerminals =
      overviewSettings.activeTerminals !== undefined
        ? Number(overviewSettings.activeTerminals)
        : 4;
    const activeTerminalsBadge = overviewSettings.activeTerminalsStatus || 'Stable';

    const pendingOrders =
      overviewSettings.pendingOrders !== undefined
        ? Number(overviewSettings.pendingOrders)
        : 0;
    const pendingOrdersBadge = overviewSettings.pendingOrdersSubtext || '0 prev';

    const cards = [
      {
        id: 'dailySales',
        key: 'dailySales',
        title: 'Daily Sales',
        value: `$${dailySales.toFixed(2)}`,
        amount: dailySales,
        badge: dailySalesBadge,
        trend: 'up',
        icon: 'trending-up',
        color: 'emerald',
      },
      {
        id: 'totalTransactions',
        key: 'totalTransactions',
        title: 'Total Transactions',
        value: `${totalTransactions}`,
        amount: totalTransactions,
        badge: totalTransactionsBadge,
        trend: 'up',
        icon: 'user-check',
        color: 'blue',
      },
      {
        id: 'activeTerminals',
        key: 'activeTerminals',
        title: 'Active Terminals',
        value: `${activeTerminals}`,
        amount: activeTerminals,
        badge: activeTerminalsBadge,
        trend: 'stable',
        icon: 'terminal',
        color: 'purple',
      },
      {
        id: 'pendingOrders',
        key: 'pendingOrders',
        title: 'Pending Orders',
        value: `${pendingOrders}`,
        amount: pendingOrders,
        badge: pendingOrdersBadge,
        trend: 'neutral',
        icon: 'alert-triangle',
        color: 'rose',
      },
    ];

    return {
      success: true,
      businessId: business.id,
      businessName: business.businessName || business.name,
      currency: 'USD',
      // Direct KPI properties
      dailySales,
      formattedDailySales: `$${dailySales.toFixed(2)}`,
      dailySalesBadge,
      totalTransactions,
      totalTransactionsBadge,
      activeTerminals,
      activeTerminalsBadge,
      pendingOrders,
      pendingOrdersBadge,
      // Array representation for direct list mapping in UI
      cards,
      // Dictionary representation for named key access
      cardsMap: {
        dailySales: cards[0],
        totalTransactions: cards[1],
        activeTerminals: cards[2],
        pendingOrders: cards[3],
      },
      // Summary stats
      inventoryCount: business._count?.products || 0,
      employeesCount: business._count?.users || 0,
      activeTicketsCount: business._count?.tickets || 0,
      vouchersCount: business._count?.vouchers || 0,
      lastSync: business.lastSync || new Date(),
    };
  }
}
