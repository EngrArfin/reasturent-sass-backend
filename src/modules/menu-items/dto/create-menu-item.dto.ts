import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @ApiProperty({
    example: 'Grilled Salmon Steak',
    description: 'Name of the dish or beverage item',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Atlantic salmon with herbs butter and fresh asparagus',
    description: 'Detailed description of ingredients or preparation',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Main Course',
    description: 'Category (e.g. Main Course, Appetizer, Dessert, Beverage)',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: 24.50,
    description: 'Price in dollars/currency',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: '20-25 mins',
    description: 'Estimated preparation time',
  })
  @IsOptional()
  @IsString()
  prepTime?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Availability flag (In Stock vs Out of Stock)',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;

  @ApiPropertyOptional({
    example: 'https://images.example.com/salmon.jpg',
    description: 'Optional image URL for the dish',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Business ID (for super admin tenant override)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
