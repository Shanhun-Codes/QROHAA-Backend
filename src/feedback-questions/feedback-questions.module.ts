import { Module } from '@nestjs/common';
import { FeedbackQuestionsService } from './feedback-questions.service';
import { FeedbackQuestionsController } from './feedback-questions.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FeedbackQuestionsController],
  providers: [FeedbackQuestionsService, PrismaService],
})
export class FeedbackQuestionsModule {}
