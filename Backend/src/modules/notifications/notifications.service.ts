import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification (OWNER only — broadcast)
   */
  async create(
    dto: CreateNotificationDto,
    userId: string,
  ) {
    // Validate targetId if targetType requires it
    if (dto.targetType === 'PRICE_GROUP' && !dto.targetId) {
      throw new ForbiddenException('Phải chọn nhóm giá khi gửi cho nhóm giá');
    }
    if (dto.targetType === 'SPECIFIC_SHOP' && !dto.targetId) {
      throw new ForbiddenException('Phải chọn cửa hàng khi gửi cho cửa hàng cụ thể');
    }

    // If targeting a price group, verify it exists
    if (dto.targetType === 'PRICE_GROUP' && dto.targetId) {
      const priceGroup = await this.prisma.priceGroup.findUnique({
        where: { id: dto.targetId },
      });
      if (!priceGroup) {
        throw new NotFoundException('Không tìm thấy nhóm giá');
      }
    }

    // If targeting a specific shop, verify it exists
    if (dto.targetType === 'SPECIFIC_SHOP' && dto.targetId) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: dto.targetId },
      });
      if (!shop) {
        throw new NotFoundException('Không tìm thấy cửa hàng');
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetType: dto.targetType,
        targetId: dto.targetId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    return notification;
  }

  /**
   * Get notifications for the current user.
   * - OWNER/FACTORY_STAFF: see ALL notifications
   * - SHOP_OWNER/SHOP_STAFF: see notifications targeted at ALL, their price group, or their shop
   */
  async findAll(
    user: { id: string; role: UserRole; shopId: string | null },
    params: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build where clause based on role
    let where: Record<string, unknown> = {};

    if (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) {
      // Shop users only see notifications targeted to them
      if (!user.shopId) {
        return { items: [], total: 0, page, limit, totalPages: 0, unreadCount: 0 };
      }

      // Get the shop's priceGroupId
      const shop = await this.prisma.shop.findUnique({
        where: { id: user.shopId },
        select: { priceGroupId: true },
      });

      if (!shop) {
        return { items: [], total: 0, page, limit, totalPages: 0, unreadCount: 0 };
      }

      where = {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'PRICE_GROUP', targetId: shop.priceGroupId },
          { targetType: 'SPECIFIC_SHOP', targetId: user.shopId },
        ],
      };
    }
    // OWNER and FACTORY_STAFF see all notifications (where = {})

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, fullName: true },
          },
          reads: {
            where: { userId: user.id },
            select: { readAt: true },
          },
          _count: {
            select: { reads: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Calculate unread count
    const unreadCount = await this.prisma.notification.count({
      where: {
        ...where,
        NOT: {
          reads: {
            some: { userId: user.id },
          },
        },
      },
    });

    // Transform to include isRead field
    const items = notifications.map((n) => ({
      ...n,
      isRead: n.reads.length > 0,
      reads: undefined, // Remove raw reads from response
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Get unread notification count for the current user
   */
  async getUnreadCount(
    user: { id: string; role: UserRole; shopId: string | null },
  ) {
    let where: Record<string, unknown> = {};

    if (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) {
      if (!user.shopId) {
        return { unreadCount: 0 };
      }

      const shop = await this.prisma.shop.findUnique({
        where: { id: user.shopId },
        select: { priceGroupId: true },
      });

      if (!shop) {
        return { unreadCount: 0 };
      }

      where = {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'PRICE_GROUP', targetId: shop.priceGroupId },
          { targetType: 'SPECIFIC_SHOP', targetId: user.shopId },
        ],
      };
    }

    const unreadCount = await this.prisma.notification.count({
      where: {
        ...where,
        NOT: {
          reads: {
            some: { userId: user.id },
          },
        },
      },
    });

    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    // Verify notification exists
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    // Upsert — don't error if already read
    await this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      create: {
        notificationId,
        userId,
      },
      update: {}, // already read, no-op
    });

    return { message: 'Đã đánh dấu đã đọc' };
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(
    user: { id: string; role: UserRole; shopId: string | null },
  ) {
    let where: Record<string, unknown> = {};

    if (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) {
      if (!user.shopId) {
        return { message: 'Đã đánh dấu tất cả đã đọc', count: 0 };
      }

      const shop = await this.prisma.shop.findUnique({
        where: { id: user.shopId },
        select: { priceGroupId: true },
      });

      if (!shop) {
        return { message: 'Đã đánh dấu tất cả đã đọc', count: 0 };
      }

      where = {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'PRICE_GROUP', targetId: shop.priceGroupId },
          { targetType: 'SPECIFIC_SHOP', targetId: user.shopId },
        ],
      };
    }

    // Find all unread notifications for this user
    const unreadNotifications = await this.prisma.notification.findMany({
      where: {
        ...where,
        NOT: {
          reads: {
            some: { userId: user.id },
          },
        },
      },
      select: { id: true },
    });

    if (unreadNotifications.length === 0) {
      return { message: 'Đã đánh dấu tất cả đã đọc', count: 0 };
    }

    // Batch create read records
    await this.prisma.notificationRead.createMany({
      data: unreadNotifications.map((n) => ({
        notificationId: n.id,
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Đã đánh dấu tất cả đã đọc',
      count: unreadNotifications.length,
    };
  }
}
