import { IsString, IsOptional, IsIn } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.DELIVERING,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ])
  status: OrderStatus;

  @IsString()
  @IsOptional()
  adminNote?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;
}
