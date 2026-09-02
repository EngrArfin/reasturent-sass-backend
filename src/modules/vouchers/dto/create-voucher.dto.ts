import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVoucherDto {
  @ApiProperty({
    example: 'Farm Chicken',
    description: 'Name of the item or voucher',
  })
  @IsString()
  @IsNotEmpty({ message: 'Voucher or item name is required' })
  name!: string;

  @ApiProperty({
    example: 72,
    description: 'Minimum price or original price of the item/order',
  })
  @IsNotEmpty({ message: 'Minimum price is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    }
    return Number(value) || 0;
  })
  minimumPrice!: number;

  @ApiProperty({
    example: '14.3%',
    description: 'Discount percentage (e.g. 14.3%, 10%) or fixed off price',
  })
  @IsString()
  @IsNotEmpty({ message: 'Off price is required' })
  offPrice!: string;

  @ApiPropertyOptional({
    example: 'SARAH',
    description: 'Staff member requesting the discount (defaults to current logged-in user)',
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({
    example: 'CHICKEN-14',
    description: 'Unique voucher code (auto-generated if omitted)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Business ID (automatically assigned for Manager)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
