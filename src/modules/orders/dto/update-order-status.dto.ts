import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { OrderStatusEnum } from './create-order.dto';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatusEnum,
    example: OrderStatusEnum.PREPARING,
    description: 'New status for the active order (PENDING, PREPARING, READY, SERVED, COMPLETED, CANCELLED)',
  })
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;
}
