import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    example: 'Monthly Plan',
    description: 'Name of the subscription plan',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'monthly',
    description: 'Type of the subscription plan (free, monthly, yearly)',
  })
  @IsString()
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
