import {
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateOrderTemplateDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];
}
