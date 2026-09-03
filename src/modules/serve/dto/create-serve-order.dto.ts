import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServeOrderItemDto {
  @ApiPropertyOptional({
    description: 'Menu item ID if selected from menu',
    example: 'm1',
  })
  @IsOptional()
  @IsString()
  menuItemId?: string;

  @ApiProperty({
    example: 'Paneer Tikka',
    description: 'Name of the dish or beverage',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 9.99,
    description: 'Unit price per item',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'Extra Spicy, No Onion',
    description: 'Dietary preferences or customization tags',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateServeOrderDto {
  @ApiProperty({
    example: '2',
    description: 'Table Number (e.g. 1, 2, 3)',
  })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiPropertyOptional({
    description: 'Restaurant Table UUID if known',
  })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional({
    example: 'Serve quickly please',
    description: 'General order remarks',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreateServeOrderItemDto],
    description: 'List of dishes and items in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServeOrderItemDto)
  items: CreateServeOrderItemDto[];
}
