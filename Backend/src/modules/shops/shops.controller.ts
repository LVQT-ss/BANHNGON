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
import { ShopsService } from './shops.service';
import { CreateShopDto, UpdateShopDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findById(@Param('id') id: string) {
    return this.shopsService.findById(id);
  }

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }

  @Get(':id/orders')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  getOrders(@Param('id') id: string, @Query('status') status?: string) {
    return this.shopsService.getOrders(id, status);
  }

  @Get(':id/debt')
  @Roles(UserRole.OWNER)
  getDebt(@Param('id') id: string) {
    return this.shopsService.getDebt(id);
  }
}
