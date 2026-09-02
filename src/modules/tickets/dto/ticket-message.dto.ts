import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddTicketMessageDto {
  @ApiProperty({
    example: 'Checking the logs now. I see a database mismatch error.',
    description: 'Message content sent in the communication thread',
  })
  @IsString()
  @IsNotEmpty({ message: 'Message text cannot be empty' })
  message!: string;
}
