import { IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PriceItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;
}

export class UpdatePricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceItemDto)
  items: PriceItemDto[];
}
