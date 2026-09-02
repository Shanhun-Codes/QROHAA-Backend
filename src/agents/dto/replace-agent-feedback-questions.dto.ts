import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AgentFeedbackQuestionSelectionDto {
  @IsString()
  questionId!: string;

  @IsBoolean()
  required!: boolean;

  @IsInt()
  sortOrder!: number;
}

export class ReplaceAgentFeedbackQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentFeedbackQuestionSelectionDto)
  questions!: AgentFeedbackQuestionSelectionDto[];
}
