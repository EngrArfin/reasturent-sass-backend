import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryMenuItemDto {
  @ApiPropertyOptional({
    description: 'Search menu dishes by name or description',
    example: 'Salmon',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category (ALL, Main Course, Appetizer, Dessert, Beverage)',
    example: 'Main Course',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by stock availability',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isAvailable?: boolean;

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
