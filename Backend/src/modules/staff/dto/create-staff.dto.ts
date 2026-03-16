import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
