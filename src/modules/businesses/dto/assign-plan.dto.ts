import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class AssignPlanDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'The ID of the subscription plan to assign to the business',
  })
  @IsUUID()
  @IsString()
  subscriptionPlanId!: string;
}
