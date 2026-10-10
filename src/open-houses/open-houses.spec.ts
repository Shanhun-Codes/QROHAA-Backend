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
    agentFeedbackQuestion: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  } as any;
  const service = new OpenHousesService(prisma);
  const dto = {
    agentId: 'agent-1',
    propertyId: 'property-1',
    startsAt: new Date(),
    endsAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.openHouse.findUnique.mockResolvedValue(null);
  });

  it('snapshots active agent questions when creating an open house', async () => {
    prisma.agentFeedbackQuestion.findMany.mockResolvedValue([
      { questionId: 'question-1', required: true, sortOrder: 0 },
    ]);
    transaction.openHouse.create.mockResolvedValue({ id: 'open-house-1' });
    await service.create(dto);
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
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists newest open houses and forwards controller creation', () => {
    service.findAll();
    expect(prisma.openHouse.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    jest
      .spyOn(service, 'create')
      .mockResolvedValue({ id: 'open-house-1' } as any);
  });
});
