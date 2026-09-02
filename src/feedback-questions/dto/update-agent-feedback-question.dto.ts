import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAgentFeedbackQuestionDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
