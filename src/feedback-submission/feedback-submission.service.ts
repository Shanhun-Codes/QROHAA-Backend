import { Injectable } from '@nestjs/common';
import { CreateFeedbackSubmissionDto } from './dto/create-feedback-submission.dto';
import { UpdateFeedbackSubmissionDto } from './dto/update-feedback-submission.dto';

@Injectable()
export class FeedbackSubmissionService {
  create(createFeedbackSubmissionDto: CreateFeedbackSubmissionDto) {
    return 'This action adds a new feedbackSubmission';
  }

  findAll() {
    return `This action returns all feedbackSubmission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} feedbackSubmission`;
  }

  update(id: number, updateFeedbackSubmissionDto: UpdateFeedbackSubmissionDto) {
    return `This action updates a #${id} feedbackSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} feedbackSubmission`;
  }
}
