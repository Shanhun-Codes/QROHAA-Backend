import { Module } from '@nestjs/common';
import { FeedbackSubmissionService } from './feedback-submission.service';
import { FeedbackSubmissionController } from './feedback-submission.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FeedbackSubmissionController],
  providers: [FeedbackSubmissionService, PrismaService],
})
export class FeedbackSubmissionModule {}
