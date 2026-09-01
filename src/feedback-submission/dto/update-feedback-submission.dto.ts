import { PartialType } from '@nestjs/swagger';
import { CreateFeedbackSubmissionDto } from './create-feedback-submission.dto';

export class UpdateFeedbackSubmissionDto extends PartialType(CreateFeedbackSubmissionDto) {}
