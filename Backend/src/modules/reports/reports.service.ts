import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Revenue report — total revenue, order count, avg order value
   */
  async getRevenue(params: { from?: string; to?: string; shopId?: string }) {
    const where = this.buildOrderWhere(params, [OrderStatus.COMPLETED]);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        totalAmount: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Group by date for chart data
    const dailyRevenue: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const order of orders) {
      const date = (order.completedAt ?? order.createdAt)
        .toISOString()
        .split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0, orders: 0 };
      }
      dailyRevenue[date].revenue += Number(order.totalAmount);
      dailyRevenue[date].orders += 1;
    }

    return {
      totalRevenue,
      orderCount,
      avgOrderValue,
      dailyRevenue: Object.values(dailyRevenue),
    };
  }

  /**
   * Top products report — most ordered products by quantity and revenue
   */
  async getTopProducts(params: { from?: string; to?: string; limit?: number }) {
    const { from, to, limit = 20 } = params;

    const orderWhere: Record<string, unknown> = {
      status: OrderStatus.COMPLETED,
    };

    if (from || to) {
      orderWhere.createdAt = {};
      if (from) (orderWhere.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (orderWhere.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'unit'],
      where: {
        order: orderWhere,
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: Number(item._sum.totalPrice ?? 0),
      orderCount: item._count.id,
    }));
  }

  /**
   * Top shops report — shops ranked by order volume and revenue
   */
  async getTopShops(params: { from?: string; to?: string; limit?: number }) {
    const { from, to, limit = 20 } = params;

    const where: Prisma.OrderWhereInput = {
      status: OrderStatus.COMPLETED,
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const groupedOrders = await this.prisma.order.groupBy({
      by: ['shopId'],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: limit,
    });

    // Get shop names
    const shopIds = groupedOrders.map((o) => o.shopId);
    const shops = await this.prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: {
        id: true,
        name: true,
        currentDebt: true,
        creditLimit: true,
      },
    });

    const shopMap = new Map(shops.map((s) => [s.id, s]));

    return groupedOrders.map((item) => {
      const shop = shopMap.get(item.shopId);
      return {
        shopId: item.shopId,
        shopName: shop?.name ?? 'Khong ro',
        totalRevenue: Number(item._sum.totalAmount ?? 0),
        orderCount: item._count.id,
        currentDebt: Number(shop?.currentDebt ?? 0),
        creditLimit: Number(shop?.creditLimit ?? 0),
      };
    });
  }

  /**
   * Export orders data (for Excel — returns raw data, frontend renders)
   */
  async getExportOrders(params: { from?: string; to?: string; shopId?: string }) {
    const where = this.buildOrderWhere(params);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        shop: { select: { name: true } },
        createdBy: { select: { fullName: true } },
        items: {
          select: {
            productName: true,
            unit: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000, // Safety limit
    });

    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      shopName: o.shop.name,
      createdBy: o.createdBy.fullName,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      deliveryDate: o.deliveryDate?.toISOString() ?? null,
      note: o.note,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item) => ({
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }));
  }

  /**
   * Export debts data (for Excel — returns raw data, frontend renders)
   */
  async getExportDebts() {
    const shops = await this.prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      select: {
        name: true,
        address: true,
        phone: true,
        creditLimit: true,
        currentDebt: true,
        priceGroup: { select: { name: true } },
        _count: {
          select: {
            orders: { where: { status: OrderStatus.COMPLETED } },
            payments: true,
          },
        },
      },
      orderBy: { currentDebt: 'desc' },
    });

    return shops.map((s) => ({
      shopName: s.name,
      address: s.address,
      phone: s.phone,
      priceGroup: s.priceGroup.name,
      creditLimit: Number(s.creditLimit),
      currentDebt: Number(s.currentDebt),
      remainingCredit: Number(s.creditLimit) - Number(s.currentDebt),
      completedOrders: s._count.orders,
      totalPayments: s._count.payments,
    }));
  }

  private buildOrderWhere(
    params: { from?: string; to?: string; shopId?: string },
    statuses?: OrderStatus[],
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (params.shopId) {
      where.shopId = params.shopId;
    }

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }

    return where;
  }
}
