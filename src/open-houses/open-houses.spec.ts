jest.mock('src/agents/agents.service', () => ({ AgentsService: class {} }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (classRef: unknown) => classRef,
}));

import { BadRequestException } from '@nestjs/common';
import { OpenHousesService } from './open-houses.service';

describe('OpenHouse resource', () => {
  const transaction = { openHouse: { create: jest.fn() } } as any;
  const prisma = {
    openHouse: { findUnique: jest.fn(), findMany: jest.fn() },
    property: { findFirst: jest.fn() },
    agentFeedbackQuestion: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  } as any;
  const service = new OpenHousesService(prisma, {} as never);
  const dto = {
    agentId: 'agent-1',
    propertyId: 'property-1',
    startsAt: '2026-11-06T18:00:00Z',
    endsAt: '2026-11-06T20:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.openHouse.findUnique.mockResolvedValue(null);
    prisma.property.findFirst.mockResolvedValue({ id: 'property-1' });
  });

  it('snapshots active agent questions when creating an open house', async () => {
    prisma.agentFeedbackQuestion.findMany.mockResolvedValue([
      { questionId: 'question-1', required: true, sortOrder: 0 },
    ]);
    transaction.openHouse.create.mockResolvedValue({ id: 'open-house-1' });
    await service.create('agent-1', dto);
    expect(transaction.openHouse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openHouseFeedbackQuestions: {
            createMany: {
              data: [
                { questionId: 'question-1', required: true, sortOrder: 0 },
              ],
            },
          },
        }),
      }),
    );
  });

  it('rejects creation when the agent has no active question selection', async () => {
    prisma.agentFeedbackQuestion.findMany.mockResolvedValue([]);
    await expect(service.create('agent-1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists newest open houses', () => {
    service.findAll();
    expect(prisma.openHouse.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});
