import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

// Valid status transitions
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

interface UserPayload {
  id: string;
  role: UserRole;
  shopId?: string | null;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, user: UserPayload) {
    // Only SHOP_OWNER and SHOP_STAFF can create orders
    const shopId = dto.shopId || user.shopId;
    if (!shopId) {
      throw new BadRequestException('Không xác định được cửa hàng');
    }

    // Shop users can only order for their own shop
    if (
      (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) &&
      shopId !== user.shopId
    ) {
      throw new ForbiddenException('Bạn chỉ có thể đặt hàng cho cửa hàng của mình');
    }

    // Validate shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      throw new NotFoundException('Cửa hàng không tồn tại');
    }

    if (shop.status !== 'ACTIVE') {
      throw new BadRequestException('Cửa hàng đã bị vô hiệu hóa');
    }

    // Get products and their prices for this shop's price group
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Một số sản phẩm không tồn tại hoặc đã ngưng bán');
    }

    // Get price group prices
    const priceItems = await this.prisma.priceGroupItem.findMany({
      where: {
        priceGroupId: shop.priceGroupId,
        productId: { in: productIds },
      },
    });
    const priceMap = new Map(
      priceItems.map((item) => [item.productId, item.price]),
    );

    // Validate min order quantities and build order items
    const orderItems: Array<{
      productId: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: Decimal;
      totalPrice: Decimal;
      note?: string;
    }> = [];

    let totalAmount = new Decimal(0);

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      if (item.quantity < product.minOrderQty) {
        throw new BadRequestException(
          `${product.name}: số lượng tối thiểu là ${product.minOrderQty} ${product.unit}`,
        );
      }

      const unitPrice = priceMap.get(product.id) || product.basePrice;
      const itemTotal = new Decimal(unitPrice.toString()).mul(item.quantity);

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice: new Decimal(unitPrice.toString()),
        totalPrice: itemTotal,
        note: item.note,
      });

      totalAmount = totalAmount.add(itemTotal);
    }

    // Credit limit check (0 means unlimited)
    if (Number(shop.creditLimit) > 0) {
      const remainingCredit = new Decimal(shop.creditLimit.toString()).sub(
        new Decimal(shop.currentDebt.toString()),
      );
      if (totalAmount.greaterThan(remainingCredit)) {
        throw new BadRequestException(
          `Vượt hạn mức nợ. Còn lại: ${remainingCredit.toFixed(0)}đ. Vui lòng thanh toán trước.`,
        );
      }
    }

    // Generate order number: DH-YYYYMMDD-NNN
    const orderNumber = await this.generateOrderNumber();

    // Calculate delivery date based on cutoff time
    const deliveryDate = dto.deliveryDate
      ? new Date(dto.deliveryDate)
      : this.calculateDeliveryDate();

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          shopId,
          createdById: user.id,
          status: OrderStatus.PENDING,
          totalAmount,
          deliveryDate,
          deliveryAddress: dto.deliveryAddress || shop.address,
          note: dto.note,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          shop: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return newOrder;
    });

    return order;
  }

  async findAll(user: UserPayload, status?: string, shopId?: string) {
    const where: Record<string, unknown> = {};

    // Data isolation: shop users only see their own orders
    if (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) {
      where.shopId = user.shopId;
    } else if (shopId) {
      where.shopId = shopId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        shop: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: UserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, address: true, phone: true } },
        createdBy: { select: { id: true, fullName: true, phone: true } },
        confirmedBy: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Data isolation
    if (
      (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) &&
      order.shopId !== user.shopId
    ) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, user: UserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Check valid transition
    const validTransitions = STATUS_TRANSITIONS[order.status];
    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${order.status} sang ${dto.status}`,
      );
    }

    // Shop owners can only cancel their own PENDING orders
    if (user.role === UserRole.SHOP_OWNER) {
      if (dto.status !== OrderStatus.CANCELLED) {
        throw new ForbiddenException('Cửa hàng chỉ có thể hủy đơn hàng');
      }
      if (order.shopId !== user.shopId) {
        throw new ForbiddenException('Bạn chỉ có thể hủy đơn của cửa hàng mình');
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể hủy đơn đang chờ xác nhận');
      }
    }

    // SHOP_STAFF cannot update order status
    if (user.role === UserRole.SHOP_STAFF) {
      throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái đơn hàng');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: dto.status,
    };

    if (dto.adminNote) {
      updateData.adminNote = dto.adminNote;
    }

    // Handle specific status transitions
    if (dto.status === OrderStatus.CONFIRMED) {
      updateData.confirmedById = user.id;
      updateData.confirmedAt = new Date();
    }

    if (dto.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();

      // Add totalAmount to shop's currentDebt
      await this.prisma.shop.update({
        where: { id: order.shopId },
        data: {
          currentDebt: {
            increment: order.totalAmount,
          },
        },
      });
    }

    if (dto.status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = dto.cancelReason || 'Không có lý do';
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        shop: { select: { id: true, name: true } },
        items: true,
        createdBy: { select: { id: true, fullName: true } },
        confirmedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DH-${dateStr}-`;

    // Find the last order number for today
    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  private calculateDeliveryDate(): Date {
    const now = new Date();
    const cutoffHour = 20; // Default 20:00, ideally from Settings

    const delivery = new Date(now);
    if (now.getHours() < cutoffHour) {
      // Before cutoff: deliver tomorrow
      delivery.setDate(delivery.getDate() + 1);
    } else {
      // After cutoff: deliver day after tomorrow
      delivery.setDate(delivery.getDate() + 2);
    }

    // Set to start of day
    delivery.setHours(0, 0, 0, 0);

    return delivery;
  }
}
