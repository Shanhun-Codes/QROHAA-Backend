import { Module } from '@nestjs/common';
import { FeedbackSubmissionService } from './feedback-submission.service';
import { FeedbackSubmissionController } from './feedback-submission.controller';

@Module({
  controllers: [FeedbackSubmissionController],
  providers: [FeedbackSubmissionService],
})
export class FeedbackSubmissionModule {}
