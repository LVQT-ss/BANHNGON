import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrderTemplatesService } from './order-templates.service';
import { CreateOrderTemplateDto, UpdateOrderTemplateDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('order-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderTemplatesController {
  constructor(private orderTemplatesService: OrderTemplatesService) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  findAll(
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  create(
    @Body() dto: CreateOrderTemplateDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderTemplateDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.remove(id, user);
  }

  @Post(':id/use')
  @Roles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF)
  useTemplate(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.orderTemplatesService.useTemplate(id, user);
  }
}
