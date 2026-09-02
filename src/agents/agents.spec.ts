import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (classRef: unknown) => classRef,
}));

import { BadRequestException } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

describe('Agents resource', () => {
  const transaction = {
    agent: { create: jest.fn() },
    agentFeedbackQuestion: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;
  const prisma = {
    agent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    feedbackQuestion: { findMany: jest.fn(), count: jest.fn() },
    agentFeedbackQuestion: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  } as any;
  const service = new AgentsService(prisma);
  const controller = new AgentsController(service);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.agent.findUnique.mockResolvedValue(null);
  });

  it('creates an agent with normalized colors and active default questions', async () => {
    prisma.feedbackQuestion.findMany.mockResolvedValue([{ id: 'question-1' }]);
    transaction.agent.create.mockResolvedValue({ id: 'agent-1' });
    await service.create({
      firstName: 'Ava',
      lastName: 'Agent',
      email: 'ava@example.com',
      phone: '+14155552671',
      primaryColor: 'ffffff',
    } as any);
    expect(transaction.agent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          primaryColor: '#ffffff',
          agentFeedbackQuestions: {
            create: [{ questionId: 'question-1', sortOrder: 0 }],
          },
        }),
      }),
    );
  });

  it('rejects duplicate feedback-question selections', async () => {
    prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' });
    await expect(
      service.replaceFeedbackQuestions('agent-1', [
        { questionId: 'question-1', required: false, sortOrder: 0 },
        { questionId: 'question-1', required: true, sortOrder: 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns sorted active selections and forwards controller requests', async () => {
    prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' });
    await service.getFeedbackQuestions('agent-1');
    expect(prisma.agentFeedbackQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { sortOrder: 'asc' } }),
    );
    expect(controller.getFeedbackQuestions('agent-1')).toBeInstanceOf(Promise);
  });

  it('updates an agent by string ID and normalizes supplied branding colors', async () => {
    prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' });
    prisma.agent.update.mockResolvedValue({
      id: 'agent-1',
      primaryColor: '#ffffff',
    });

    await controller.update('agent-1', {
      headline: 'Updated',
      primaryColor: 'ffffff',
    } as any);

    expect(prisma.agent.update).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: { headline: 'Updated', primaryColor: '#ffffff' },
    });
  });
});
