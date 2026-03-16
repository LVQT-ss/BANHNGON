import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePriceGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
