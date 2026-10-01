import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackSubmissionsService } from './feedback-submissions.service';

@Module({
  controllers: [],
  providers: [FeedbackSubmissionsService, PrismaService],
})
export class FeedbackSubmissionsModule {}
