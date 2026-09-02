import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'Farm Chicken',
    description: 'Name of the product',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'RENE-1002',
    description: 'Barcode or SKU number. Auto-generated if left blank.',
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    example: 'RENE-1002',
    description: 'Custom SKU identifier (falls back to barcode if omitted)',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    example: 5,
    default: 0,
    description: 'Initial stock quantity in inventory',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({
    example: 5,
    default: 0,
    description: 'Alternative alias for initial stock from frontend form',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  initialStock?: number;

  @ApiProperty({
    example: 12.5,
    description: 'Unit selling price of the product ($)',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Business ID (Auto-resolved from JWT token for Manager; optional override for Super Admin)',
  })
  @IsString()
  @IsOptional()
  businessId?: string;
}
