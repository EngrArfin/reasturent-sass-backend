import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'RESOLVED',
    description: 'Updated ticket status',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  @ApiPropertyOptional({
    example: 'HIGH',
    description: 'Ticket priority',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({
    example: 'Updated issue title',
    description: 'Updated ticket title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated details regarding the issue',
    description: 'Updated ticket description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Hardware/Printer Error',
    description: 'Updated category',
  })
  @IsString()
  @IsOptional()
  category?: string;
}
