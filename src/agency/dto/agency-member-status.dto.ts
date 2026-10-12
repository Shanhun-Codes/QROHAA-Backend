import { IsIn } from 'class-validator';
export class AgencyMemberStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}
