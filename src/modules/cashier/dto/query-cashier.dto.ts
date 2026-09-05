import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryCashierTablesDto {
  @ApiPropertyOptional({
    description: 'Filter by station type (table or bar)',
    example: 'table',
    enum: ['table', 'bar'],
  })
  @IsOptional()
  @IsString()
  type?: 'table' | 'bar';

  @ApiPropertyOptional({
    description: 'Filter by status (ALL, empty, served, occupied, billing)',
    example: 'ALL',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Search keyword matching table number or label',
    example: 'Table 1',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryCashierMenuDto {
  @ApiPropertyOptional({
    description: 'Filter by food category (ALL, Main, Starters, Breads, Beverages)',
    example: 'ALL',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search keyword matching dish name or description',
    example: 'Biryani',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
