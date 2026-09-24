import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationPreferencesDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Receive daily sales and settlement reports via email',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Get notified when products drop below 5 units',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Instant alert when a POS terminal fails to synchronize',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  syncErrorAlerts?: boolean;
}
