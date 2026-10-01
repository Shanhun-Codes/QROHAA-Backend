import { Module } from '@nestjs/common';
import { FeedbackQuestionsService } from './feedback-questions.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [],
  providers: [FeedbackQuestionsService, PrismaService],
  exports: [FeedbackQuestionsService],
})
export class FeedbackQuestionsModule {}
