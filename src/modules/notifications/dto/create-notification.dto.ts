import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export enum NotificationType {
  ALL = 'ALL',
  SYSTEM = 'SYSTEM',
  TICKETS = 'TICKETS',
  ORDERS = 'ORDERS',
  SYNC = 'SYNC',
  INVENTORY = 'INVENTORY',
}

export class CreateNotificationDto {
  @ApiProperty({
    example: 'New Support Ticket #8821',
    description: 'Notification headline / title',
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'Hardware/Printer timeout error reported on Terminal 2.',
    description: 'Detailed notification alert message',
  })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    example: 'TICKETS',
    enum: NotificationType,
    description: 'Notification category / feed tab type',
    default: NotificationType.SYSTEM,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'Hardware Error',
    description: 'Sub-category or tag label',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: '/tickets/8821',
    description: 'Action link for navigating directly to the entity',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({
    example: 'b5f63412-28e4-4fa0-827d-998811223344',
    description: 'Target restaurant business ID (defaults to current user business)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    example: 'u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    description: 'Target specific user ID (optional, if private alert)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: { ticketId: '8821', terminalId: 'Terminal 2', priority: 'HIGH' },
    description: 'Arbitrary metadata payload',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
