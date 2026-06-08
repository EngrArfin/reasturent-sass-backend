import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  name: string | undefined;

  @IsString()
  businessName: string | undefined;

  @IsEmail()
  email: string | undefined;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  settings?: {
    timezone?: string;
    currency?: string;
    taxRate?: number;
  };
}
