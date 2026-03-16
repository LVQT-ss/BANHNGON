import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsString()
  ownerName: string;

  @IsString()
  @IsOptional()
  taxCode?: string;

  @IsString()
  priceGroupId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @IsString()
  @IsOptional()
  note?: string;

  // SHOP_OWNER account to create alongside the shop
  @IsString()
  ownerPhone: string;

  @IsString()
  ownerPassword: string;

  @IsString()
  @IsOptional()
  ownerEmail?: string;
}
