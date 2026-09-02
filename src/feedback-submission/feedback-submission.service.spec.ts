import { describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { FeedbackSubmissionService } from './feedback-submission.service';

describe('FeedbackSubmissionService', () => {
  const prisma = {
    feedbackSubmission: { findMany: jest.fn() },
  } as any;
  const service = new FeedbackSubmissionService(prisma);

  it('returns submissions with question-first answers', async () => {
    prisma.feedbackSubmission.findMany.mockResolvedValue([
      {
        id: 'submission-1',
        feedbackAnswers: [
          {
            value: '4',
            question: {
              id: 'question-1',
              key: 'overall_rating',
              label: 'Overall Appeal',
              type: 'RATING',
            },
          },
        ],
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'submission-1',
        questions: [
          {
            id: 'question-1',
            key: 'overall_rating',
            label: 'Overall Appeal',
            type: 'RATING',
            answer: '4',
          },
        ],
      },
    ]);
  });
});
