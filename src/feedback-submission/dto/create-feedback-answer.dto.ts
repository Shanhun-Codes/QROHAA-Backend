import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFeedbackAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  value!: string;
}
