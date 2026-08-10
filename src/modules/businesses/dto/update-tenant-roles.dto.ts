import { IsArray, IsString } from 'class-validator';

export class UpdateTenantRolesDto {
  @IsArray()
  @IsString({ each: true })
  allowedRoles!: string[];
}
