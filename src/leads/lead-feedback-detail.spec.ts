jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));
import { LeadsService } from './leads.service';
import { PropertiesService } from '../properties/properties.service';

describe('agent feedback ownership and history', () => {
  it('limits lead and submission history to the authenticated agent and returns every answer with context', () => {
    const findUnique = jest.fn();
    const service = new LeadsService({ lead: { findUnique } } as never);
    service.findLeadDetail('owner-1', 'lead-1');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { agentId: 'owner-1', id: 'lead-1' },
        select: expect.objectContaining({
          submissions: expect.objectContaining({
            where: { openHouse: { agentId: 'owner-1' } },
            orderBy: { createdAt: 'desc' },
            select: expect.objectContaining({
              id: true,
              openHouse: expect.objectContaining({
                select: expect.objectContaining({
                  property: true,
                  startsAt: true,
                }),
              }),
              feedbackAnswers: expect.not.objectContaining({
                where: expect.anything(),
              }),
            }),
          }),
        }),
      }),
    );
  });
  it('limits property history and its events to the authenticated agent', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = new PropertiesService({ property: { findFirst } } as never);
    await expect(
      service.findAgentPropertyDetail('owner-1', 'other-property'),
    ).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'other-property', agentId: 'owner-1' },
        include: expect.objectContaining({
          openHouses: expect.objectContaining({
            where: { agentId: 'owner-1' },
          }),
        }),
      }),
    );
  });
  it('does not permit a lead edit to change its owner', async () => {
    const update = jest.fn().mockResolvedValue({});
    const service = new LeadsService({
      lead: {
        findFirst: jest.fn().mockResolvedValue({ id: 'lead-1' }),
        update,
      },
    } as never);
    await service.update('owner-1', 'lead-1', {
      firstName: 'Edited',
      agentId: 'other-owner',
    } as never);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-1', agentId: 'owner-1' },
        data: expect.not.objectContaining({ agentId: expect.anything() }),
      }),
    );
  });
});
