import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { CreateFeedbackAnswerDto } from './create-feedback-answer.dto';

export class CreateFeedbackSubmissionDto {
  @IsNotEmpty()
  @IsString()
  openHouseId!: string;

  @IsArray()
  @IsNotEmpty()
  feedbackAnswers!: CreateFeedbackAnswerDto[];
}
