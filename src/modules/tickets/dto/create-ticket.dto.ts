import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export enum TicketCategory {
  SYNC_ISSUE = 'Sync Issue',
  HARDWARE_PRINTER_ERROR = 'Hardware/Printer Error',
  INVENTORY_BARCODE_ERROR = 'Inventory/Barcode Error',
  PAYMENT_FAILURE = 'Payment Failure',
}

export class CreateTicketDto {
  @ApiProperty({
    example: 'Sync Issue',
    description: 'Issue Category selected from the UI buttons: Sync Issue, Hardware/Printer Error, Inventory/Barcode Error, Payment Failure',
    enum: TicketCategory,
  })
  @IsString()
  @IsNotEmpty({ message: 'Issue category is required' })
  category!: string;

  @ApiProperty({
    example: 'Inventory items are not syncing with the cashier terminal after adding new product.',
    description: 'Detailed description of what happened',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @ApiPropertyOptional({
    example: 'Sync Issue with POS Terminal',
    description: 'Optional ticket title/subject (auto-generated if omitted)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'RENE-POS-8821',
    description: 'Auto-captured POS terminal device identifier',
    default: 'RENE-POS-8821',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({
    example: 'v2.4.1-stable',
    description: 'Auto-captured POS terminal software version',
    default: 'v2.4.1-stable',
  })
  @IsString()
  @IsOptional()
  softwareVersion?: string;

  @ApiPropertyOptional({
    example: '2026-07-01T15:22:04.000Z',
    description: 'Auto-captured last sync timestamp',
  })
  @IsOptional()
  lastSync?: string;

  @ApiPropertyOptional({
    example: 'MEDIUM',
    description: 'Ticket urgency priority (LOW, MEDIUM, HIGH, URGENT)',
    default: 'MEDIUM',
  })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Associated business ID (auto-scoped for Manager; optional for Super Admin)',
  })
  @IsUUID()
  @IsOptional()
  businessId?: string;
}
