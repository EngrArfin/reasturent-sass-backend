import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockAdjustmentType {
  SET = 'SET',
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
}

export class UpdateStockDto {
  @ApiProperty({
    example: 10,
    description: 'Quantity value to set, add, or subtract',
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    enum: StockAdjustmentType,
    default: StockAdjustmentType.SET,
    description: 'Adjustment type: SET (override current stock), ADD (restock), SUBTRACT (deduct stock)',
  })
  @IsEnum(StockAdjustmentType)
  @IsOptional()
  type?: StockAdjustmentType = StockAdjustmentType.SET;

  @ApiPropertyOptional({
    example: 'New shipment received from vendor',
    description: 'Optional note or reason for stock adjustment',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
