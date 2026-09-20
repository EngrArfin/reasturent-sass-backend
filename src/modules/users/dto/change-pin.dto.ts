import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangePinDto {
  @ApiProperty({
    example: '1234',
    description: 'New 4-digit quick-login PIN',
  })
  @IsNotEmpty({ message: 'PIN is required' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin!: string;
}
