import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockStatusFilter {
  ALL = 'ALL',
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class QueryProductDto {
  @ApiPropertyOptional({
    example: 'Farm Chicken',
    description: 'Search keyword for Product Name or Barcode / SKU',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number for pagination',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Number of items per page',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: StockStatusFilter,
    default: StockStatusFilter.ALL,
    description: 'Filter products by stock status level',
  })
  @IsEnum(StockStatusFilter)
  @IsOptional()
  stockStatus?: StockStatusFilter = StockStatusFilter.ALL;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Filter by Business ID (Only accessible by Super Admin; Managers always see their own business products)',
  })
  @IsString()
  @IsOptional()
  businessId?: string;
}
