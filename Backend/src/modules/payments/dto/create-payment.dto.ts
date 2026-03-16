import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  shopId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  receiptImage?: string;

  @IsString()
  @IsOptional()
  momoTransId?: string;
}
