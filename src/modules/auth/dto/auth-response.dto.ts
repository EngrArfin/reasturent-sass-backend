import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'User ID' })
  _id!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'MANAGER', description: 'Role of the user' })
  role!: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', required: false, description: 'Business ID' })
  businessId?: string;

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
