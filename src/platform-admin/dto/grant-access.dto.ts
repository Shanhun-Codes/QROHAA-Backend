import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class GrantAccessDto {
  @IsIn(['BETA', 'PAID'])
  type!: 'BETA' | 'PAID';

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
