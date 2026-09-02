import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const prisma = {
    lead: { findUnique: jest.fn(), update: jest.fn() },
  } as any;
  const service = new LeadsService(prisma);

  it('updates a lead by its string ID', async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
    prisma.lead.update.mockResolvedValue({ id: 'lead-1', status: 'CONTACTED' });

    await expect(service.update('lead-1', { firstName: 'Jordan' })).resolves.toEqual({
      id: 'lead-1',
      status: 'CONTACTED',
    });
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { firstName: 'Jordan' },
    });
  });

  it('rejects updates for unknown leads', async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { lastName: 'Lee' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
