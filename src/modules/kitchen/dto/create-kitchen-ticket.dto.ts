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

export class KitchenItemModifierDto {
  @ApiProperty({ example: 'Extra Spicy', description: 'Modifier name / instruction' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class CreateKitchenItemDto {
  @ApiProperty({ example: 'PANEER TIKKA', description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: ['Extra Spicy'],
    description: 'Modifiers or custom notes array',
  })
  @IsOptional()
  @IsArray()
  modifiers?: string[];

  @ApiPropertyOptional({ example: 'Grill', description: 'Prep station for this item' })
  @IsOptional()
  @IsString()
  station?: string;
}

export class CreateKitchenTicketDto {
  @ApiProperty({ example: '3', description: 'Table or Token Number' })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiPropertyOptional({ example: 'Grill', description: 'Kitchen station (Grill, Tandoor, Beverage)' })
  @IsOptional()
  @IsString()
  station?: string;

  @ApiProperty({
    type: [CreateKitchenItemDto],
    description: 'Ordered items for the kitchen ticket',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKitchenItemDto)
  items: CreateKitchenItemDto[];

  @ApiPropertyOptional({ description: 'Business ID for super admin' })
  @IsOptional()
  @IsString()
  businessId?: string;
}
