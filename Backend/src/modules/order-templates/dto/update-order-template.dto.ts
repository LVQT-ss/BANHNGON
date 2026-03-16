import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateItemDto } from './create-order-template.dto';

export class UpdateOrderTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  @IsOptional()
  items?: TemplateItemDto[];
}
