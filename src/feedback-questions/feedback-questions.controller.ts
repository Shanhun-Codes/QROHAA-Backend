import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackQuestionsService } from './feedback-questions.service';
import { CreateFeedbackQuestionDto } from './dto/create-feedback-question.dto';
import { UpdateFeedbackQuestionDto } from './dto/update-feedback-question.dto';

@Controller('feedback-questions')
export class FeedbackQuestionsController {
  constructor(private readonly feedbackQuestionsService: FeedbackQuestionsService) {}

  @Post()
  create(@Body() createFeedbackQuestionDto: CreateFeedbackQuestionDto) {
    return this.feedbackQuestionsService.create(createFeedbackQuestionDto);
  }

  @Get()
  findAll() {
    return this.feedbackQuestionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackQuestionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedbackQuestionDto: UpdateFeedbackQuestionDto) {
    return this.feedbackQuestionsService.update(+id, updateFeedbackQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbackQuestionsService.remove(+id);
  }
}
