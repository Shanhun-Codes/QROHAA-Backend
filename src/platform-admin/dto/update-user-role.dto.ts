import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['AGENT', 'AGENCY_ADMIN'])
  role!: 'AGENT' | 'AGENCY_ADMIN';

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  agencyName?: string;
}
