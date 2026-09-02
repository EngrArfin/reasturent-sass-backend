import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScanBarcodeDto {
  @ApiProperty({
    example: 'RENE-1001',
    description: 'Scanned barcode value, SKU, product UUID, or QR code payload',
  })
  @IsString()
  @IsNotEmpty({ message: 'Barcode, SKU, or QR code is required' })
  code!: string;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Optional business ID (Super Admin only; Managers are auto-scoped)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
