import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateManagerDto {
  @IsString()
  name: string = '';

  @IsEmail()
  email: string = '';

  @IsString()
  @MinLength(6)
  password: string = '';

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin: string = '';
}

function MaxLength(length: number) {
  return function (target: any, propertyKey: string) {
    // Implementation
  };
}
