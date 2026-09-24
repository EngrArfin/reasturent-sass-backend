import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationDto {
  @ApiPropertyOptional({
    example: 'ALL',
    description: 'Filter category: ALL, UNREAD, SYSTEM, TICKETS, ORDERS',
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional({
    example: 'Terminal 2',
    description: 'Search string matching title or message',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Limit items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'b5f63412-28e4-4fa0-827d-998811223344',
    description: 'Business ID (Super Admin override)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
