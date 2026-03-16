import { IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsString()
  @IsOptional()
  from?: string; // ISO date string

  @IsString()
  @IsOptional()
  to?: string; // ISO date string

  @IsString()
  @IsOptional()
  shopId?: string;
}
