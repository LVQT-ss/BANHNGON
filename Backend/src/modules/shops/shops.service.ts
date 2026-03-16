import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto, UpdateShopDto } from './dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shop.findMany({
      include: {
        priceGroup: { select: { id: true, name: true } },
        _count: { select: { users: true, orders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        priceGroup: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Cửa hàng không tồn tại');
    }

    return shop;
  }

  async create(dto: CreateShopDto) {
    // Check price group exists
    const priceGroup = await this.prisma.priceGroup.findUnique({
      where: { id: dto.priceGroupId },
    });
    if (!priceGroup) {
      throw new NotFoundException('Nhóm giá không tồn tại');
    }

    // Check owner phone is unique
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.ownerPhone },
    });
    if (existingUser) {
      throw new ConflictException('Số điện thoại chủ cửa hàng đã được sử dụng');
    }

    // Create shop + SHOP_OWNER account in a transaction
    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: dto.name,
          address: dto.address,
          phone: dto.phone,
          ownerName: dto.ownerName,
          taxCode: dto.taxCode,
          priceGroupId: dto.priceGroupId,
          creditLimit: dto.creditLimit || 0,
          note: dto.note,
        },
      });

      await tx.user.create({
        data: {
          phone: dto.ownerPhone,
          email: dto.ownerEmail,
          passwordHash,
          fullName: dto.ownerName,
          role: UserRole.SHOP_OWNER,
          shopId: shop.id,
        },
      });

      return shop;
    });

    return this.findById(result.id);
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.findById(id);

    if (dto.priceGroupId) {
      const priceGroup = await this.prisma.priceGroup.findUnique({
        where: { id: dto.priceGroupId },
      });
      if (!priceGroup) {
        throw new NotFoundException('Nhóm giá không tồn tại');
      }
    }

    return this.prisma.shop.update({
      where: { id },
      data: dto,
      include: {
        priceGroup: { select: { id: true, name: true } },
      },
    });
  }

  async getOrders(shopId: string, status?: string) {
    await this.findById(shopId);

    const where: Record<string, unknown> = { shopId };
    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: true,
        createdBy: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDebt(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        currentDebt: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Cửa hàng không tồn tại');
    }

    // Get recent payments
    const recentPayments = await this.prisma.payment.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        confirmedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Get recent completed orders that added to debt
    const recentOrders = await this.prisma.order.findMany({
      where: { shopId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        completedAt: true,
      },
    });

    return {
      shop,
      remainingCredit: Number(shop.creditLimit) - Number(shop.currentDebt),
      recentPayments,
      recentOrders,
    };
  }
}
