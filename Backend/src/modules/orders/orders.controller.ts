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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.FACTORY_STAFF,
    UserRole.SHOP_OWNER,
    UserRole.SHOP_STAFF,
  )
  findAll(
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
    @Query('status') status?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ordersService.findAll(user, status, shopId);
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.FACTORY_STAFF,
    UserRole.SHOP_OWNER,
    UserRole.SHOP_STAFF,
  )
  findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.ordersService.findById(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF, UserRole.SHOP_OWNER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }
}
