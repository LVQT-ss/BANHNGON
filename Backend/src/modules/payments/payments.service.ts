import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreatePaymentDto,
    user: { id: string; role: UserRole },
  ) {
    // Verify shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id: dto.shopId },
    });

    if (!shop) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    // Validate amount doesn't exceed current debt (optional: allow overpayment)
    if (Number(shop.currentDebt) <= 0) {
      throw new BadRequestException('Cửa hàng không có công nợ');
    }

    // Create payment and decrement shop debt in a transaction
    const payment = await this.prisma.$transaction(async (tx) => {
      // Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          shopId: dto.shopId,
          amount: dto.amount,
          method: dto.method,
          note: dto.note,
          receiptImage: dto.receiptImage,
          momoTransId: dto.momoTransId,
          // Auto-confirm if created by OWNER or FACTORY_STAFF
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          shop: {
            select: { id: true, name: true },
          },
          confirmedBy: {
            select: { id: true, fullName: true },
          },
        },
      });

      // Decrement shop's currentDebt
      await tx.shop.update({
        where: { id: dto.shopId },
        data: {
          currentDebt: {
            decrement: dto.amount,
          },
        },
      });

      return newPayment;
    });

    return payment;
  }

  async findAll(
    params: {
      shopId?: string;
      method?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { shopId, method, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (shopId) where.shopId = shopId;
    if (method) where.method = method;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          shop: {
            select: { id: true, name: true },
          },
          confirmedBy: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            creditLimit: true,
            currentDebt: true,
          },
        },
        confirmedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy khoản thanh toán');
    }

    return payment;
  }

  async confirm(
    id: string,
    user: { id: string; role: UserRole },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy khoản thanh toán');
    }

    if (payment.confirmedAt) {
      throw new BadRequestException('Khoản thanh toán đã được xác nhận');
    }

    // Confirm and decrement debt in transaction
    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
        include: {
          shop: {
            select: { id: true, name: true },
          },
          confirmedBy: {
            select: { id: true, fullName: true },
          },
        },
      });

      // Decrement shop's currentDebt
      await tx.shop.update({
        where: { id: payment.shopId },
        data: {
          currentDebt: {
            decrement: payment.amount,
          },
        },
      });

      return updated;
    });

    return confirmed;
  }

  async getDebtSummary() {
    // Get all shops with their debt info
    const shops = await this.prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        creditLimit: true,
        currentDebt: true,
        priceGroup: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            orders: {
              where: { status: 'COMPLETED' },
            },
            payments: true,
          },
        },
      },
      orderBy: { currentDebt: 'desc' },
    });

    // Calculate totals
    const totalDebt = shops.reduce(
      (sum, shop) => sum + Number(shop.currentDebt),
      0,
    );
    const totalCreditLimit = shops.reduce(
      (sum, shop) => sum + Number(shop.creditLimit),
      0,
    );

    return {
      shops,
      totalDebt,
      totalCreditLimit,
      shopCount: shops.length,
    };
  }
}
