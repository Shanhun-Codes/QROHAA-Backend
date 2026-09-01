import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackSubmissionService } from './feedback-submission.service';

describe('FeedbackSubmissionService', () => {
  let service: FeedbackSubmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackSubmissionService],
    }).compile();

    service = module.get<FeedbackSubmissionService>(FeedbackSubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
