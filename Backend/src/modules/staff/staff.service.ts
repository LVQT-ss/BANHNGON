import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './dto';

interface UserPayload {
  id: string;
  role: UserRole;
  shopId?: string | null;
}

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: UserPayload) {
    if (user.role === UserRole.OWNER) {
      // OWNER sees factory staff
      return this.prisma.user.findMany({
        where: { role: UserRole.FACTORY_STAFF },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { fullName: 'asc' },
      });
    }

    if (user.role === UserRole.SHOP_OWNER) {
      // SHOP_OWNER sees their shop's staff
      return this.prisma.user.findMany({
        where: {
          role: UserRole.SHOP_STAFF,
          shopId: user.shopId,
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { fullName: 'asc' },
      });
    }

    return [];
  }

  async create(dto: CreateStaffDto, user: UserPayload) {
    // Check phone uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (user.role === UserRole.OWNER) {
      // Create FACTORY_STAFF
      return this.prisma.user.create({
        data: {
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          role: UserRole.FACTORY_STAFF,
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }

    if (user.role === UserRole.SHOP_OWNER) {
      if (!user.shopId) {
        throw new ForbiddenException('Bạn không thuộc cửa hàng nào');
      }

      // Create SHOP_STAFF for their shop
      return this.prisma.user.create({
        data: {
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          role: UserRole.SHOP_STAFF,
          shopId: user.shopId,
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }

    throw new ForbiddenException('Bạn không có quyền tạo nhân viên');
  }

  async update(id: string, dto: UpdateStaffDto, user: UserPayload) {
    const staff = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // OWNER can only manage FACTORY_STAFF
    if (user.role === UserRole.OWNER && staff.role !== UserRole.FACTORY_STAFF) {
      throw new ForbiddenException('Bạn chỉ có thể quản lý nhân viên xưởng');
    }

    // SHOP_OWNER can only manage their own SHOP_STAFF
    if (user.role === UserRole.SHOP_OWNER) {
      if (staff.role !== UserRole.SHOP_STAFF || staff.shopId !== user.shopId) {
        throw new ForbiddenException(
          'Bạn chỉ có thể quản lý nhân viên cửa hàng của mình',
        );
      }
    }

    // Check phone uniqueness if changing
    if (dto.phone && dto.phone !== staff.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.status) updateData.status = dto.status as UserStatus;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string, user: UserPayload) {
    const staff = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // OWNER can only delete FACTORY_STAFF
    if (user.role === UserRole.OWNER && staff.role !== UserRole.FACTORY_STAFF) {
      throw new ForbiddenException('Bạn chỉ có thể xóa nhân viên xưởng');
    }

    // SHOP_OWNER can only delete their own SHOP_STAFF
    if (user.role === UserRole.SHOP_OWNER) {
      if (staff.role !== UserRole.SHOP_STAFF || staff.shopId !== user.shopId) {
        throw new ForbiddenException(
          'Bạn chỉ có thể xóa nhân viên cửa hàng của mình',
        );
      }
    }

    // Soft delete: set status to INACTIVE instead of hard delete
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
      },
    });
  }
}
