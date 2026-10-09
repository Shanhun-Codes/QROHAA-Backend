import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsIn(['AGENT', 'AGENCY'])
  accountType!: 'AGENT' | 'AGENCY';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  expiresInHours?: number;
}
