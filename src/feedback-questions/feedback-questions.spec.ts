import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { FeedbackQuestionsController } from './feedback-questions.controller';
import { FeedbackQuestionsService } from './feedback-questions.service';

describe('FeedbackQuestions resource', () => {
  const transaction = {
    feedbackQuestion: { update: jest.fn() },
    feedbackQuestionOption: { deleteMany: jest.fn() },
  } as any;
  const prisma = {
    feedbackQuestion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  } as any;
  const service = new FeedbackQuestionsService(prisma);
  const controller = new FeedbackQuestionsController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates questions with their ordered options', () => {
    const dto = {
      key: 'source',
      label: 'Source',
      type: 'SINGLE_SELECT' as any,
      options: [{ label: 'Zillow', value: 'ZILLOW', sortOrder: 0 }],
    };
    service.create(dto);
    expect(prisma.feedbackQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          options: { createMany: { data: dto.options } },
        }),
      }),
    );
  });

  it('lists questions and throws for an unknown question ID', async () => {
    service.findAll();
    expect(prisma.feedbackQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { key: 'asc' } }),
    );
    prisma.feedbackQuestion.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('replaces options transactionally on update and forwards controller IDs unchanged', async () => {
    prisma.feedbackQuestion.findUnique.mockResolvedValue({ id: 'question-1' });
    transaction.feedbackQuestion.update.mockResolvedValue({ id: 'question-1' });
    await service.update('question-1', { options: [] });
    expect(transaction.feedbackQuestionOption.deleteMany).toHaveBeenCalledWith({
      where: { questionId: 'question-1' },
    });
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'question-1' } as any);
    expect(controller.findOne('question-1')).toBeInstanceOf(Promise);
  });
});
