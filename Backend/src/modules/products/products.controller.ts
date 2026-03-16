import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  @Get('categories')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
