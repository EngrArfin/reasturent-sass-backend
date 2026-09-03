import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ServeOrderStatusEnum {
  PENDING = 'PENDING', // Confirmed
  PREPARING = 'PREPARING', // In Kitchen
  READY = 'READY', // Ready to Serve
  SERVED = 'SERVED', // Served
  COMPLETED = 'COMPLETED', // Completed
  CANCELLED = 'CANCELLED', // Cancelled
}

export class UpdateServeOrderStatusDto {
  @ApiProperty({
    enum: ServeOrderStatusEnum,
    example: ServeOrderStatusEnum.READY,
    description: 'Updated ticket status for Table Order',
  })
  @IsEnum(ServeOrderStatusEnum)
  @IsNotEmpty()
  status: ServeOrderStatusEnum;
}
