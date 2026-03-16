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
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.SHOP_OWNER)
  findAll(
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.staffService.findAll(user);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.SHOP_OWNER)
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.staffService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.SHOP_OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.staffService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.SHOP_OWNER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; shopId?: string },
  ) {
    return this.staffService.remove(id, user);
  }
}
