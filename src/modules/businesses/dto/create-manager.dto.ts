import { IsString, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManagerDto {
  @ApiProperty({
    example: 'Manager Name',
    description: 'Name of the manager',
  })
  @IsString()
  name: string = '';

  @ApiProperty({
    example: 'manager@restaurant.com',
    description: 'Manager email address for login',
  })
  @IsEmail()
  email: string = '';

  @ApiPropertyOptional({
    example: '1234',
    description: 'Manager login password (optional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: '4-digit PIN for manager quick-login',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin?: string;
}
