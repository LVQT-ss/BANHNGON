import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceGroupDto, UpdatePriceGroupDto, UpdatePricesDto } from './dto';

@Injectable()
export class PriceGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.priceGroup.findMany({
      include: {
        _count: { select: { shops: true, items: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const group = await this.prisma.priceGroup.findUnique({
      where: { id },
      include: {
        shops: { select: { id: true, name: true, status: true } },
        items: {
          include: { product: true },
          orderBy: { product: { sortOrder: 'asc' } },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Nhóm giá không tồn tại');
    }

    return group;
  }

  async create(dto: CreatePriceGroupDto) {
    const existing = await this.prisma.priceGroup.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Tên nhóm giá đã tồn tại');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.priceGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: string, dto: UpdatePriceGroupDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.priceGroup.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Tên nhóm giá đã tồn tại');
      }
    }

    if (dto.isDefault) {
      await this.prisma.priceGroup.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceGroup.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const group = await this.prisma.priceGroup.findUnique({
      where: { id },
      include: { _count: { select: { shops: true } } },
    });

    if (!group) {
      throw new NotFoundException('Nhóm giá không tồn tại');
    }

    if (group._count.shops > 0) {
      throw new ConflictException(
        'Không thể xóa nhóm giá đang có cửa hàng sử dụng',
      );
    }

    // Delete price items first, then the group
    await this.prisma.priceGroupItem.deleteMany({
      where: { priceGroupId: id },
    });

    return this.prisma.priceGroup.delete({ where: { id } });
  }

  async getPrices(id: string) {
    await this.findById(id);

    // Get all active products with their prices for this group
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const priceItems = await this.prisma.priceGroupItem.findMany({
      where: { priceGroupId: id },
    });

    const priceMap = new Map(
      priceItems.map((item) => [item.productId, item.price]),
    );

    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      category: product.category,
      basePrice: product.basePrice,
      price: priceMap.get(product.id) || product.basePrice,
      hasCustomPrice: priceMap.has(product.id),
    }));
  }

  async updatePrices(id: string, dto: UpdatePricesDto) {
    await this.findById(id);

    // Upsert all price items in a transaction
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.priceGroupItem.upsert({
          where: {
            priceGroupId_productId: {
              priceGroupId: id,
              productId: item.productId,
            },
          },
          update: { price: item.price },
          create: {
            priceGroupId: id,
            productId: item.productId,
            price: item.price,
          },
        }),
      ),
    );

    return this.getPrices(id);
  }
}
