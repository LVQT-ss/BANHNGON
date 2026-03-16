import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('revenue')
  getRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.reportsService.getRevenue({ from, to, shopId });
  }

  @Get('products')
  getTopProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts({
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('shops')
  getTopShops(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopShops({
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('export/orders')
  getExportOrders(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.reportsService.getExportOrders({ from, to, shopId });
  }

  @Get('export/debts')
  getExportDebts() {
    return this.reportsService.getExportDebts();
  }
}
