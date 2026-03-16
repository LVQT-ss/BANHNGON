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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentsService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findAll(
    @Query('shopId') shopId?: string,
    @Query('method') method?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll({
      shopId,
      method,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('debt-summary')
  @Roles(UserRole.OWNER)
  getDebtSummary() {
    return this.paymentsService.getDebtSummary();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentsService.confirm(id, user);
  }
}
