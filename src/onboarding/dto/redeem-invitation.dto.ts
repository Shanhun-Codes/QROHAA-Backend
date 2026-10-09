import { Type } from 'class-transformer';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CreateOnboardingAgentDto } from './create-onboarding-agent.dto';

export class AgencyInvitationSetupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;
}

export class RedeemInvitationDto extends PartialType(
  OmitType(CreateOnboardingAgentDto, ['email'] as const),
) {
  @IsString()
  @IsNotEmpty()
  invitationToken!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgencyInvitationSetupDto)
  agency?: AgencyInvitationSetupDto;
}
