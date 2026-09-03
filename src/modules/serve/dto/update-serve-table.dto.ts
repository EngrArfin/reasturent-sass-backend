import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ServeTableStatusEnum {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export class UpdateServeTableStatusDto {
  @ApiProperty({
    enum: ServeTableStatusEnum,
    example: ServeTableStatusEnum.OCCUPIED,
    description: 'Table status on the floor map',
  })
  @IsEnum(ServeTableStatusEnum)
  @IsNotEmpty()
  status: ServeTableStatusEnum;

  @ApiPropertyOptional({
    example: 'SERVED',
    description: 'Optional sub-status (e.g. SERVED, ORDERING)',
  })
  @IsOptional()
  @IsString()
  subStatus?: string;
}
