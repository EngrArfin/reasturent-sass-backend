import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the employee',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'server',
    description: 'Role of the employee: manager, server, kitchen, cashier, supervisor',
    default: 'server',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  role?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: '4-digit Quick Login PIN for POS',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN must be a 4-digit number' })
  pin?: string;

  @ApiPropertyOptional({
    example: 'john.doe@restaurant.com',
    description: 'Email address (optional - auto-generated if omitted)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Secret123!',
    description: 'Login password (optional - defaulted securely if omitted)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    description: 'Avatar image URL',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Business ID (Optional for Manager, required for Super Admin)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
