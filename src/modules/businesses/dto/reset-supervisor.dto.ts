import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class ResetSupervisorDto {
  @IsEmail()
  @IsOptional()
  supervisorEmail?: string;

  @IsString()
  @MinLength(4)
  newPinOrPassword!: string;
}
