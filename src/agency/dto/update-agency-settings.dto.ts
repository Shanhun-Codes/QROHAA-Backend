import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UpdateBrokerageSetupDto } from 'src/onboarding/dto/create-onboarding-agent.dto';

export class UpdateAgencySettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(200)
  name?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  headline?: string;
  @IsOptional()
  @IsString()
  @Matches(/^(?:#?(?:[\da-f]{3}|[\da-f]{6}))?$/i)
  primaryColor?: string;
  @IsOptional()
  @IsString()
  @Matches(/^(?:#?(?:[\da-f]{3}|[\da-f]{6}))?$/i)
  secondaryColor?: string;
  @IsOptional()
  @IsString()
  @Matches(/^(?:#?(?:[\da-f]{3}|[\da-f]{6}))?$/i)
  accentColor?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBrokerageSetupDto)
  brokerage?: UpdateBrokerageSetupDto;
}
