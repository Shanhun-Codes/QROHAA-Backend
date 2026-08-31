import { IsBoolean, IsString } from 'class-validator';
import { FeedbackQuestionType } from 'generated/prisma/enums';

export class CreateFeedbackQuestionDto {
  @IsString()
  key!: string

  @IsString()
  label!: string

  type!: FeedbackQuestionType

  @IsBoolean()
  active?: boolean

  options?: {
    label: string
    value: string
    sortOrder: number
  }[];
}
