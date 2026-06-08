import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { UserRole } from '../../../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email: string | undefined;

  @IsString()
  @MinLength(6)
  password: string | undefined;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsMongoId()
  @IsOptional()
  businessId?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @IsOptional()
  pin?: string;
}

function MaxLength(length: number) {
  return function (target: any, propertyKey: string) {
    // Implementation
  };
}
