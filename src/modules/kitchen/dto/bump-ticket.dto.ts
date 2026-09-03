import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum KitchenBumpAction {
  BUMP_TO_READY = 'READY',
  COMPLETE = 'COMPLETED',
  RECALL = 'PREPARING',
}

export class BumpKitchenTicketDto {
  @ApiPropertyOptional({
    enum: KitchenBumpAction,
    example: KitchenBumpAction.BUMP_TO_READY,
    description: 'Target status to bump the ticket to (READY or COMPLETED)',
  })
  @IsOptional()
  @IsEnum(KitchenBumpAction)
  targetStatus?: KitchenBumpAction;

  @ApiPropertyOptional({
    description: 'Optional station filter if bumping single station ticket',
    example: 'Grill',
  })
  @IsOptional()
  @IsString()
  station?: string;
}
