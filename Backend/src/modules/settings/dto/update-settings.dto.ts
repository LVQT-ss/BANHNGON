import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  factoryName?: string;

  @IsString()
  @IsOptional()
  factoryPhone?: string;

  @IsString()
  @IsOptional()
  factoryAddress?: string;

  @IsString()
  @IsOptional()
  cutoffTime?: string; // "20:00"

  @IsString()
  @IsOptional()
  deliveryNote?: string;
}
