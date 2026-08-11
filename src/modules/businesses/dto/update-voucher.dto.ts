import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateVoucherDto {
  @ApiPropertyOptional({
    example: 'SUPER50',
    description: 'Voucher code',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Voucher discount amount off',
  })
  @IsNumber()
  @IsOptional()
  amountOff?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Voucher expiry date',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the voucher is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the voucher has been used',
  })
  @IsBoolean()
  @IsOptional()
  isUsed?: boolean;
}
