import { PartialType } from '@nestjs/swagger';
import { CreateFeedbackQuestionDto } from './create-feedback-question.dto';

export class UpdateFeedbackQuestionDto extends PartialType(
  CreateFeedbackQuestionDto,
) {}
