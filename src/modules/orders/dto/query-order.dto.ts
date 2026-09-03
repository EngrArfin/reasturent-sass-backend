import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOrderDto {
  @ApiPropertyOptional({
    description: 'Search by order number (e.g. ORD-9021) or table number (e.g. Table #1)',
    example: 'ORD-9021',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status (ALL, PENDING, PREPARING, READY, SERVED, COMPLETED, CANCELLED)',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by table UUID',
  })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Business ID (for super admin tenant filter)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
