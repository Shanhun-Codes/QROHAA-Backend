import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { UpdateBrokerageSetupDto } from 'src/onboarding/dto/create-onboarding-agent.dto';
import { CreateAgentDto } from './create-agent.dto';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBrokerageSetupDto)
  brokerage?: UpdateBrokerageSetupDto;
}
