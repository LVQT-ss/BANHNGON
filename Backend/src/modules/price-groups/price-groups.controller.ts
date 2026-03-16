import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PriceGroupsService } from './price-groups.service';
import { CreatePriceGroupDto, UpdatePriceGroupDto, UpdatePricesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('price-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PriceGroupsController {
  constructor(private priceGroupsService: PriceGroupsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findAll() {
    return this.priceGroupsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findById(@Param('id') id: string) {
    return this.priceGroupsService.findById(id);
  }

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreatePriceGroupDto) {
    return this.priceGroupsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdatePriceGroupDto) {
    return this.priceGroupsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.priceGroupsService.remove(id);
  }

  @Get(':id/prices')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  getPrices(@Param('id') id: string) {
    return this.priceGroupsService.getPrices(id);
  }

  @Put(':id/prices')
  @Roles(UserRole.OWNER)
  updatePrices(@Param('id') id: string, @Body() dto: UpdatePricesDto) {
    return this.priceGroupsService.updatePrices(id, dto);
  }
}
