import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  code!: string;

  @IsNumber()
  amountOff!: number;

  @IsDateString()
  expiresAt!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
