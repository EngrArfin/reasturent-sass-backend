import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-voucher.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Voucher active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
