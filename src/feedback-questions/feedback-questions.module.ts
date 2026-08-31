import { Module } from '@nestjs/common';
import { FeedbackQuestionsService } from './feedback-questions.service';
import { FeedbackQuestionsController } from './feedback-questions.controller';

@Module({
  controllers: [FeedbackQuestionsController],
  providers: [FeedbackQuestionsService],
})
export class FeedbackQuestionsModule {}
