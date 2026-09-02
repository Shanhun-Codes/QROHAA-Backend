import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackSubmissionsController } from './feedback-submissions.controller';
import { FeedbackSubmissionsService } from './feedback-submissions.service';

@Module({
  controllers: [FeedbackSubmissionsController],
  providers: [FeedbackSubmissionsService, PrismaService],
})
export class FeedbackSubmissionsModule {}
