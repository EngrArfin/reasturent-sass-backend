import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../enums/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.MANAGER,
    description: 'The role of the user',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: '60d0fe4f5311236168a109ca',
    description: 'The business ID if registering as a business user',
  })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'The optional quick-login PIN',
  })
  @IsString()
  @IsOptional()
  pin?: string;
}

