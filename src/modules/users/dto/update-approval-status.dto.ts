import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateApprovalStatusDto {
  @ApiPropertyOptional({
    description: 'Approval status action',
    example: 'APPROVED',
    enum: ['APPROVED', 'BLOCKED', 'PENDING', 'ACCEPT', 'REJECT'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Whether the employee is active / approved',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Alternative boolean flag for approval',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
