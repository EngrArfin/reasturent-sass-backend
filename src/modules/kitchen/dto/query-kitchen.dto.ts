import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum KitchenViewTab {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export class QueryKitchenDto {
  @ApiPropertyOptional({
    description: 'Filter tickets by view tab (ACTIVE or COMPLETED)',
    enum: KitchenViewTab,
    default: KitchenViewTab.ACTIVE,
  })
  @IsOptional()
  @IsEnum(KitchenViewTab)
  tab?: KitchenViewTab = KitchenViewTab.ACTIVE;

  @ApiPropertyOptional({
    description: 'Search by table number, ticket ID, or dish item name',
    example: 'Paneer Tikka',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific kitchen prep station (e.g. Grill, Tandoor, Beverage)',
    example: 'Grill',
  })
  @IsOptional()
  @IsString()
  station?: string;

  @ApiPropertyOptional({
    description: 'Business ID (for super admin override)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
