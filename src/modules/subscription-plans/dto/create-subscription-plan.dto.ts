import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    example: 'Yearly Plan',
    description: 'Unique name of the subscription plan',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'YEARLY',
    description: 'Type / billing cycle of the subscription plan',
    enum: ['FREE', 'MONTHLY', 'YEARLY'],
  })
  @IsString()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return value;
    const v = value.trim().toUpperCase();
    if (v === 'YEAR' || v === 'YEARLY') return 'YEARLY';
    if (v === 'MONTH' || v === 'MONTHLY') return 'MONTHLY';
    if (v === 'FREE') return 'FREE';
    return v;
  })
  type!: string;

  @ApiProperty({
    example: 'Full app access with support',
    description: 'Description of the subscription plan benefits',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 99.00,
    description: 'Price of the subscription plan',
  })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Currency code',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the subscription plan is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
