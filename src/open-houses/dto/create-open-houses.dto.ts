import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { OpenHouseFeedbackQuestionDto } from './open-house-feedback-question.dto';

export class CreateOpenHousesDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsDateString()
  @IsNotEmpty()
  startsAt!: string;

  @IsDateString()
  @IsNotEmpty()
  endsAt!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenHouseFeedbackQuestionDto)
  feedbackQuestions?: OpenHouseFeedbackQuestionDto[];
}
