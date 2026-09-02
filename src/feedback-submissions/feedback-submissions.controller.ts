import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FeedbackSubmissionsService } from './feedback-submissions.service';
import { CreateFeedbackSubmissionDto } from './dto/create-feedback-submission.dto';

@Controller('feedback-submission')
export class FeedbackSubmissionsController {
  constructor(
    private readonly feedbackSubmissionService: FeedbackSubmissionsService,
  ) {}

  // @Post()
  // create(@Body() createFeedbackSubmissionDto: CreateFeedbackSubmissionDto) {
  //   return this.feedbackSubmissionService.create(createFeedbackSubmissionDto);
  // }

  // @Get()
  // findAll() {
  //   return this.feedbackSubmissionService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.feedbackSubmissionService.findOne(id);
  // }
}
