import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({
    example: 'Foodies Hub Restaurant',
    description: 'Name of the business / restaurant tenant',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({
    example: '99.99',
    description: 'Monthly subscription fee ($ or CFA)',
  })
  @IsString()
  @IsOptional()
  subscriptionFee?: string;

  @ApiPropertyOptional({
    example: 'supervisor@foodieshub.com',
    description: 'Initial Supervisor / Restaurant Owner email address',
  })
  @IsEmail()
  @IsOptional()
  supervisorEmail?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: '4-digit PIN for supervisor authentication',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @IsOptional()
  supervisorPin?: string;

  @ApiPropertyOptional({
    example: 'manager@foodieshub.com',
    description: 'Initial Manager email address',
  })
  @IsEmail()
  @IsOptional()
  managerEmail?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: '4-digit PIN for manager authentication',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @IsOptional()
  managerPin?: string;

  @ApiProperty({
    example: ['manager', 'server', 'cashier', 'kitchen'],
    description: 'List of enabled operational roles for this business tenant',
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
    example: 'foodies-hub',
    description: 'Unique slug or business name identifier',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'contact@foodieshub.com',
    description: 'General business contact email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: { timezone: 'UTC', currency: 'USD', taxRate: 5 },
    description: 'Additional business settings object',
  })
  @IsOptional()
  settings?: any;

  @ApiPropertyOptional({
    example: 'd9b2d63d-a233-4123-840e-3d84a7e9cb65',
    description: 'ID of the assigned subscription plan',
  })
  @IsString()
  @IsOptional()
  subscriptionPlanId?: string;
}

