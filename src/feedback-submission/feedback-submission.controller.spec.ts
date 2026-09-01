import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackSubmissionController } from './feedback-submission.controller';
import { FeedbackSubmissionService } from './feedback-submission.service';

describe('FeedbackSubmissionController', () => {
  let controller: FeedbackSubmissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackSubmissionController],
      providers: [FeedbackSubmissionService],
    }).compile();

    controller = module.get<FeedbackSubmissionController>(FeedbackSubmissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
