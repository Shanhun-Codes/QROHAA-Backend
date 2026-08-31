import { Injectable } from '@nestjs/common';
import { CreateFeedbackQuestionDto } from './dto/create-feedback-question.dto';
import { UpdateFeedbackQuestionDto } from './dto/update-feedback-question.dto';

@Injectable()
export class FeedbackQuestionsService {
  create(createFeedbackQuestionDto: CreateFeedbackQuestionDto) {
    return 'This action adds a new feedbackQuestion';
  }

  findAll() {
    return `This action returns all feedbackQuestions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} feedbackQuestion`;
  }

  update(id: number, updateFeedbackQuestionDto: UpdateFeedbackQuestionDto) {
    return `This action updates a #${id} feedbackQuestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} feedbackQuestion`;
  }
}
