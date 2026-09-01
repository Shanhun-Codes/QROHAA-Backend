import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackSubmissionService } from 'src/feedback-submission/feedback-submission.service';
import { CreateFeedbackSubmissionDto } from 'src/feedback-submission/dto/create-feedback-submission.dto';

@Module({
  controllers: [PublicController],
  providers: [PublicService, PrismaService, FeedbackSubmissionService, CreateFeedbackSubmissionDto],
})
export class PublicModule {}
