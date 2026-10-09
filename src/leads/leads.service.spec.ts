import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const prisma = {
    lead: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const service = new LeadsService(prisma);

  it('uses the authenticated agent ID rather than a client-supplied owner', async () => {
    prisma.lead.create.mockResolvedValue({
      id: 'lead-1',
      agentId: 'agent-owner',
    });

    await service.create('agent-owner', {
      firstName: 'Taylor',
      agentId: 'other-agent',
    } as any);

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ agentId: 'agent-owner' }),
      }),
    );
  });

  it('updates a lead by its string ID', async () => {
    prisma.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prisma.lead.update.mockResolvedValue({ id: 'lead-1', status: 'CONTACTED' });

    await expect(
      service.update('agent-1', 'lead-1', { firstName: 'Jordan' }),
    ).resolves.toEqual({
      id: 'lead-1',
      status: 'CONTACTED',
    });
    expect(prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-1', agentId: 'agent-1' },
        data: { firstName: 'Jordan' },
        include: expect.objectContaining({ submissions: expect.any(Object) }),
      }),
    );
  });

  it('rejects updates for unknown leads', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.update('agent-1', 'missing', { lastName: 'Lee' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('includes linked submissions when loading leads', () => {
    service.findAll();
    service.findOne('lead-1');

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({ submissions: expect.any(Object) }),
      }),
    );
    expect(prisma.lead.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({ submissions: expect.any(Object) }),
      }),
    );
  });

  it('returns only selected feedback answers for each lead submission', () => {
    service.findAllLeadsWithSelectedFeedback();

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          submissions: expect.objectContaining({
            select: expect.objectContaining({
              feedbackAnswers: expect.objectContaining({
                where: {
                  question: {
                    key: {
                      in: [
                        'budget_range',
                        'pre_qualified',
                        'purchase_timeline',
                      ],
                    },
                  },
                },
              }),
            }),
          }),
        }),
      }),
    );
  });
});
