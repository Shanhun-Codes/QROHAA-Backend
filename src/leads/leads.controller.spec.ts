import { describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { LeadsController } from './leads.controller';

describe('LeadsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const controller = new LeadsController(service as any);

  it('forwards an update with the string lead ID', () => {
    controller.update('lead-1', { firstName: 'Jordan' });

    expect(service.update).toHaveBeenCalledWith('lead-1', {
      firstName: 'Jordan',
    });
  });
});
