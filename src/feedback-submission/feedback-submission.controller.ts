import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackSubmissionService } from './feedback-submission.service';
import { CreateFeedbackSubmissionDto } from './dto/create-feedback-submission.dto';
import { UpdateFeedbackSubmissionDto } from './dto/update-feedback-submission.dto';

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
    return this.feedbackSubmissionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedbackSubmissionDto: UpdateFeedbackSubmissionDto) {
    return this.feedbackSubmissionService.update(+id, updateFeedbackSubmissionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbackSubmissionService.remove(+id);
  }
}
