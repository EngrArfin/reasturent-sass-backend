import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Printer issue resolved',
    description: 'Updated ticket title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'RESOLVED',
    description: 'Status of the support ticket',
    enum: ['OPEN', 'RESOLVED', 'CLOSED'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'RESOLVED', 'CLOSED'])
  status?: string;
}
