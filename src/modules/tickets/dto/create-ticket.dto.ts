import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Printer not connecting to cashier terminal',
    description: 'Title or issue description of the ticket',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Associated business tenant ID',
  })
  @IsUUID()
  @IsOptional()
  businessId?: string;
}
