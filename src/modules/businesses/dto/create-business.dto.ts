import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiPropertyOptional({
    example: 'Foodies Hub Restaurant',
    description: 'Name of the business / restaurant tenant',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({
    example: 'foodies-hub',
    description: 'Unique slug or business name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'manager@example.com',
    description: 'Manager email address',
  })
  @IsEmail()
  @IsOptional()
  managerEmail?: string;

  @ApiPropertyOptional({
    example: 'manager@example.com',
    description: 'Business email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: '4-digit PIN for manager authentication',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @IsOptional()
  managerPin?: string;

  @ApiPropertyOptional({
    example: '99.99',
    description: 'Monthly subscription fee ($)',
  })
  @IsString()
  @IsOptional()
  subscriptionFee?: string;

  @ApiPropertyOptional({
    example: ['manager', 'server', 'cashier', 'kitchen'],
    description: 'List of enabled employee roles for this business tenant',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedRoles?: string[];

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Main Street, City',
    description: 'Business address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: { timezone: 'UTC', currency: 'USD', taxRate: 5 },
    description: 'Additional business settings object',
  })
  @IsOptional()
  settings?: any;
}
