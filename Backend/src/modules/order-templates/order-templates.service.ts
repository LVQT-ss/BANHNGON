import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderTemplateDto, UpdateOrderTemplateDto } from './dto';

interface UserPayload {
  id: string;
  role: UserRole;
  shopId?: string | null;
}

@Injectable()
export class OrderTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: UserPayload) {
    // Templates belong to a shop, users can only see their own shop's templates
    if (!user.shopId) {
      return [];
    }

    return this.prisma.orderTemplate.findMany({
      where: { shopId: user.shopId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, user: UserPayload) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Đơn mẫu không tồn tại');
    }

    // Data isolation: only same shop
    if (template.shopId !== user.shopId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn mẫu này');
    }

    // Enrich items with current product info
    const items = template.items as Array<{
      productId: string;
      quantity: number;
      note?: string;
    }>;

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enrichedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        productName: product?.name || 'Sản phẩm không tồn tại',
        unit: product?.unit || '',
        isActive: product?.isActive ?? false,
      };
    });

    return {
      ...template,
      items: enrichedItems,
    };
  }

  async create(dto: CreateOrderTemplateDto, user: UserPayload) {
    if (!user.shopId) {
      throw new ForbiddenException('Bạn không thuộc cửa hàng nào');
    }

    return this.prisma.orderTemplate.create({
      data: {
        name: dto.name,
        items: JSON.parse(JSON.stringify(dto.items)),
        shopId: user.shopId,
        userId: user.id,
      },
    });
  }

  async update(id: string, dto: UpdateOrderTemplateDto, user: UserPayload) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Đơn mẫu không tồn tại');
    }

    if (template.shopId !== user.shopId) {
      throw new ForbiddenException('Bạn không có quyền sửa đơn mẫu này');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.items) updateData.items = JSON.parse(JSON.stringify(dto.items));

    return this.prisma.orderTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, user: UserPayload) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Đơn mẫu không tồn tại');
    }

    if (template.shopId !== user.shopId) {
      throw new ForbiddenException('Bạn không có quyền xóa đơn mẫu này');
    }

    return this.prisma.orderTemplate.delete({ where: { id } });
  }

  async useTemplate(id: string, user: UserPayload) {
    // Get template with enriched data
    const template = await this.findById(id, user);

    if (!user.shopId) {
      throw new ForbiddenException('Bạn không thuộc cửa hàng nào');
    }

    // Return items formatted for order creation
    // The frontend will use this to pre-fill the order form
    // Prices should be fetched at order creation time (current prices)
    const items = (
      template.items as Array<{
        productId: string;
        quantity: number;
        note?: string;
        isActive: boolean;
      }>
    ).filter((item) => item.isActive);

    return {
      shopId: user.shopId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
      })),
      templateName: template.name,
    };
  }
}
