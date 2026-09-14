import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAgentFeedbackQuestionDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
