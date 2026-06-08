import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../../enums/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  name: string | undefined;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string | undefined;

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
