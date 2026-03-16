import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where = category ? { category } : {};
    return this.prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        priceItems: {
          include: { priceGroup: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        image: dto.image,
        unit: dto.unit || 'cái',
        basePrice: dto.basePrice,
        minOrderQty: dto.minOrderQty || 1,
        category: dto.category || 'Khác',
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id); // Check existence

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id); // Check existence

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getCategories() {
    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return products.map((p) => p.category);
  }
}
