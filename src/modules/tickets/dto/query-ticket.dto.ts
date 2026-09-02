import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTicketDto {
  @ApiPropertyOptional({
    example: 'OPEN',
    description: 'Filter by ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: 'Sync Issue',
    description: 'Filter by issue category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'printer',
    description: 'Search keyword in title, description, or device ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'd8c7c975-d1fb-4813-9ec8-f1f4b23267f5',
    description: 'Filter by Business ID (Super Admin only; Managers are auto-scoped)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
