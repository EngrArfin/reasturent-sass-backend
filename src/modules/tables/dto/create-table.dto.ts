import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export enum TableStatusEnum {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export class CreateRestaurantTableDto {
  @ApiProperty({
    example: '7',
    description: 'Table number or identifier (e.g. 7 or T-07)',
  })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiProperty({
    example: '4 Persons',
    description: 'Seating capacity (e.g. 2 Persons, 4 Persons, 6 Persons)',
  })
  @IsString()
  @IsNotEmpty()
  capacity: string;

  @ApiProperty({
    example: 'Main Hall',
    description: 'Restaurant zone or section (e.g. Main Hall, Terrace, VIP Lounge, Bar Area)',
  })
  @IsString()
  @IsNotEmpty()
  section: string;

  @ApiPropertyOptional({
    enum: TableStatusEnum,
    default: TableStatusEnum.AVAILABLE,
    description: 'Initial table status',
  })
  @IsOptional()
  @IsEnum(TableStatusEnum)
  status?: TableStatusEnum;

  @ApiPropertyOptional({
    example: 'SERVED',
    description: 'Sub status (e.g. SERVED, ORDER_PLACED, BILL_PRINTED)',
  })
  @IsOptional()
  @IsString()
  subStatus?: string;

  @ApiPropertyOptional({
    description: 'Business ID (for super admin tenant override)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
