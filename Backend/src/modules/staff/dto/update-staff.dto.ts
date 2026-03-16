import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  MinLength,
} from 'class-validator';

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'BANNED'])
  @IsOptional()
  status?: string;
}
