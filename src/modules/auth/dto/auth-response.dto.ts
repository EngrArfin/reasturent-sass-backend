import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessProfileInfoDto {
  @ApiProperty({ example: 'b5f63412-28e4-4fa0-827d-998811223344', description: 'Business ID' })
  id!: string;

  @ApiProperty({ example: 'foodies-hub', description: 'Business Slug' })
  name!: string;

  @ApiProperty({ example: 'Foodies Hub Restaurant', description: 'Restaurant Display Name' })
  businessName!: string;

  @ApiProperty({ example: true, description: 'Business active status' })
  isActive!: boolean;
}

export class UserProfileDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'User ID' })
  id!: string;

  @ApiProperty({ example: 'Olivia Rhye', description: 'Full name' })
  name!: string;

  @ApiProperty({ example: 'manager@rene-pos.com', description: 'Professional Email address' })
  email!: string;

  @ApiProperty({ example: 'manager', description: 'Role of the user (super_admin, supervisor, manager, cashier, server, kitchen)' })
  role!: string;

  @ApiPropertyOptional({ example: '••••', description: 'Masked login PIN' })
  pin?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    description: 'Avatar image URL',
  })
  avatar?: string;

  @ApiPropertyOptional({ example: 'b5f63412-28e4-4fa0-827d-998811223344', description: 'Business ID' })
  businessId?: string;

  @ApiPropertyOptional({ type: BusinessProfileInfoDto, description: 'Associated restaurant business details' })
  business?: BusinessProfileInfoDto;

  @ApiPropertyOptional({
    example: { emailAlerts: true, lowStockAlerts: true, syncErrorAlerts: false },
    description: 'User notification preferences',
  })
  notificationPreferences?: Record<string, boolean>;

  @ApiProperty({ example: true, description: 'Account status' })
  isActive!: boolean;

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt?: string;

  @ApiProperty({ example: '2026-08-06T00:00:00.000Z', description: 'Update timestamp' })
  updatedAt?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Bearer access token',
  })
  access_token!: string;

  @ApiProperty({ type: UserProfileDto, description: 'Authenticated user details' })
  user!: UserProfileDto;
}

export class SuccessMessageResponseDto {
  @ApiProperty({ example: true, description: 'Operation status' })
  success!: boolean;

  @ApiProperty({ example: 'Password updated successfully', description: 'Response message' })
  message!: string;
}
