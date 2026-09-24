import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'manager123',
    description: 'Current active password for verification',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    example: 'NewSecurePass@2026',
    description: 'New password (minimum 6 characters)',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;

  @ApiProperty({
    example: 'NewSecurePass@2026',
    description: 'Confirm new password matching newPassword',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString()
  confirmPassword!: string;
}
