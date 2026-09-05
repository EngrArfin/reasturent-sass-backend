import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@gmail.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'The 4-digit PIN or password of the user (min 4 characters)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'PIN / Password must be at least 4 characters long' })
  password?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'The 4-digit Quick-Login PIN',
  })
  @IsOptional()
  @IsString()
  pin?: string;
}

