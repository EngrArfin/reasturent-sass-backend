import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateOrderItemDto {
  @ApiPropertyOptional({
    description: 'Menu item ID if linking from catalog',
    example: 'd14f49e2-8df2-4217-9154-1b3ac9201a41',
  })
  @IsOptional()
  @IsString()
  menuItemId?: string;

  @ApiProperty({
    example: 'Grilled Salmon Steak',
    description: 'Name of the dish or drink',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity ordered',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 24.50,
    description: 'Unit price',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'No onions',
    description: 'Custom notes or instructions for this item',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: 'ORD-9021',
    description: 'Custom order number (generated automatically if left blank)',
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'Restaurant Table UUID if dine-in',
  })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional({
    example: 'Table #1',
    description: 'Table label or number (e.g. Table #1, Takeaway)',
  })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
    description: 'Initial order status',
  })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiPropertyOptional({
    example: 'Extra cutlery please',
    description: 'Order instructions / notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of dishes/drinks in this order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Business ID (for super admin tenant override)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
