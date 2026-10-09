import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';

export class BrokerageAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  zip!: string;
}

export class BrokerageSetupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @ValidateNested()
  @Type(() => BrokerageAddressDto)
  address!: BrokerageAddressDto;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}

export class CreateOnboardingAgentDto extends CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  realEstateLicenseNumber!: string;

  @ValidateNested()
  @Type(() => BrokerageSetupDto)
  brokerage!: BrokerageSetupDto;
}
