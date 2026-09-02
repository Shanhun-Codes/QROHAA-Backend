import { describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { FeedbackSubmissionController } from './feedback-submissions.controller';

describe('FeedbackSubmissionController', () => {
  const service = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
  const controller = new FeedbackSubmissionController(service as any);

  it('forwards the submission body to the service', () => {
    const dto = { openHouseId: 'open-house-1', feedbackAnswers: [] };
    controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
