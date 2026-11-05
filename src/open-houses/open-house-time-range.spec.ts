jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('src/agents/agents.service', () => ({ AgentsService: class {} }));
import { OpenHousesService } from './open-houses.service';

describe('Open-house time ranges', () => {
  const existing = {
    id: 'event',
    startsAt: '2026-11-06T18:00:00Z',
    endsAt: '2026-11-06T20:00:00Z',
  };
  const prisma = {
    openHouse: { findFirst: jest.fn().mockResolvedValue(existing) },
  };
  const service = new OpenHousesService(prisma as never, {} as never);
  it.each([
    ['2026-11-06T18:00:00Z', '2026-11-06T18:00:00Z'],
    ['2026-11-06T20:00:00Z', '2026-11-06T18:00:00Z'],
    ['invalid', '2026-11-06T18:00:00Z'],
  ])(
    'rejects invalid creation before querying data (%s, %s)',
    async (startsAt, endsAt) => {
      await expect(
        service.create('agent', { propertyId: 'property', startsAt, endsAt }),
      ).rejects.toThrow('end must be after');
    },
  );
  it('validates a partial update against the persisted other endpoint', async () => {
    await expect(
      service.update('agent', 'event', { startsAt: '2026-11-06T21:00:00Z' }),
    ).rejects.toThrow('end must be after');
    await expect(
      service.update('agent', 'event', { endsAt: '2026-11-06T17:00:00Z' }),
    ).rejects.toThrow('end must be after');
  });
});
