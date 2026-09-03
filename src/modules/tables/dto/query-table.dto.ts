import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRestaurantTableDto {
  @ApiPropertyOptional({
    description: 'Search by table ID, capacity, section',
    example: 'Main Hall',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by table status (ALL, AVAILABLE, OCCUPIED, RESERVED)',
    example: 'AVAILABLE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by section (Main Hall, Terrace, VIP Lounge, Bar Area)',
    example: 'Main Hall',
  })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Business ID (for super admin tenant filter)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
