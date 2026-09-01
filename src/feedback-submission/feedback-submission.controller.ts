import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackSubmissionService } from './feedback-submission.service';
import { CreateFeedbackSubmissionDto } from './dto/create-feedback-submission.dto';

@Controller('feedback-submission')
export class FeedbackSubmissionController {
  constructor(private readonly feedbackSubmissionService: FeedbackSubmissionService) {}

  @Post()
  create(@Body() createFeedbackSubmissionDto: CreateFeedbackSubmissionDto) {
    return this.feedbackSubmissionService.create(createFeedbackSubmissionDto);
  }

  @Get()
  findAll() {
    return this.feedbackSubmissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackSubmissionService.findOne(id);
  }
}
