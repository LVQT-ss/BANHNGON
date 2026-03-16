import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.OWNER)
  create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.create(dto, user.id);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF, UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  findAll(
    @CurrentUser() user: { id: string; role: UserRole; shopId: string | null },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF, UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  getUnreadCount(
    @CurrentUser() user: { id: string; role: UserRole; shopId: string | null },
  ) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch('read-all')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF, UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  markAllAsRead(
    @CurrentUser() user: { id: string; role: UserRole; shopId: string | null },
  ) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF, UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
