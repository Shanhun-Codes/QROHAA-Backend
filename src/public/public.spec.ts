jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('Public resource', () => {
  const prisma = { agent: { findUnique: jest.fn() }, openHouse: { findUnique: jest.fn(), findFirst: jest.fn() } } as any;
  const service = new PublicService(prisma);
  const controller = new PublicController(service);

  beforeEach(() => jest.clearAllMocks());

  it('selects only public agent profile fields', () => {
    service.findPublicAgentBySlug('michael-elder');
    expect(prisma.agent.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'michael-elder' },
      select: expect.not.objectContaining({ email: true }),
    }));
  });

  it('returns resolved branding and sorted question DTOs for public configuration', async () => {
    prisma.agent.findUnique.mockResolvedValue({ slug: 'michael-elder', firstName: 'Michael', lastName: 'Elder', phone: '4175763487', brokerageName: null, headline: null, logoUrl: null, headshotUrl: null, primaryColor: null, secondaryColor: null, accentColor: null });
    prisma.openHouse.findFirst.mockResolvedValue({ publicCode: 'CODE1234', startsAt: new Date(), endsAt: new Date(), property: null, openHouseFeedbackQuestions: [{ required: true, sortOrder: 0, question: { id: 'question-1', key: 'source', label: 'Source', type: 'SINGLE_SELECT', category: 'BUYER_PROFILE', options: [] } }] });
    const result = await service.getConfigurationData('michael-elder', 'CODE1234');
    expect(result.branding).toEqual({ primaryColor: '#1E3A5F', secondaryColor: '#4F6F8F', accentColor: '#D4A853' });
    expect(result.feedbackForm.questions[0]).toMatchObject({ id: 'question-1', required: true, sortOrder: 0 });
  });

  it('forwards all public controller lookups', () => {
    prisma.agent.findUnique.mockReturnValue({});
    prisma.openHouse.findUnique.mockReturnValue({});
    expect(controller.findAgent('michael-elder')).toEqual({});
    expect(controller.findOpenHouseByPublicCode('CODE1234')).toEqual({});
    expect(controller.getConfigurationData('michael-elder', 'CODE1234')).toBeInstanceOf(Promise);
  });
});