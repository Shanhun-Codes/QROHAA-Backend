import { IsEmail, IsIn, IsOptional } from 'class-validator';
export class InviteAgencyMemberDto {
  @IsEmail()
  email!: string;
  @IsOptional()
  @IsIn(['AGENT', 'AGENCY_ADMIN'])
  role?: 'AGENT' | 'AGENCY_ADMIN';
}
