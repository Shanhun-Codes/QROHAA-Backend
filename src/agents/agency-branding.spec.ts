import { ForbiddenException } from '@nestjs/common';
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('src/storage/storage.service', () => ({ StorageService: class {} }));
import { AgentsService } from './agents.service';
function setup() {
  const profile = {
    id: 'agent-1',
    agencyId: 'agency-1',
    brandingLocked: true,
    logoUrl: 'personal-logo',
    headshotUrl: 'personal-headshot',
    primaryColor: '#aaaaaa',
    brokerage: { name: 'Old brokerage' },
  };
  const agency = {
    logoUrl: 'agency-logo',
    primaryColor: '#123456',
    secondaryColor: '#ffffff',
    accentColor: '#654321',
    brokerage: { name: 'Agency Brokerage' },
  };
  const prisma = {
    agent: {
      findUnique: jest.fn().mockResolvedValue(profile),
      update: jest.fn(),
    },
    agency: { findUnique: jest.fn().mockResolvedValue(agency) },
  };
  const storage = {
    createReadUrl: jest.fn(async (key) => `signed:${key}`),
    validateAgentAssetKey: jest.fn().mockReturnValue(true),
    delete: jest.fn(),
  };
  return {
    service: new AgentsService(prisma as never, storage as never),
    profile,
    agency,
    prisma,
    storage,
  };
}
describe('Agency-owned agent branding', () => {
  it('resolves agency logo/colors/brokerage at read time and retains the agent headshot', async () => {
    const { service, profile, agency, prisma } = setup();
    expect(await service.withAssetUrls(profile)).toMatchObject({
      logoUrl: 'signed:agency-logo',
      primaryColor: '#123456',
      headshotUrl: 'signed:personal-headshot',
      brokerage: { name: 'Agency Brokerage' },
      brandingLocked: true,
    });
    agency.primaryColor = '#999999';
    expect(await service.withAssetUrls(profile)).toMatchObject({
      primaryColor: '#999999',
    });
    expect(prisma.agent.update).not.toHaveBeenCalled();
  });
  it('rejects attempts to edit inherited colors', async () => {
    const { service, prisma } = setup();
    await expect(
      service.update('agent-1', { primaryColor: '#000000' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.agent.update).not.toHaveBeenCalled();
  });
  it('rejects replacing an agency logo through the asset completion endpoint', async () => {
    const { service, prisma } = setup();
    await expect(
      service.completeAssetUpload(
        'agent-1',
        'logo',
        'agents/agent-1/logo/test.png',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.agent.update).not.toHaveBeenCalled();
  });
  it('allows the agent to update their own headshot', async () => {
    const { service, prisma } = setup();
    await service.completeAssetUpload(
      'agent-1',
      'headshot',
      'agents/agent-1/headshot/test.png',
    );
    expect(prisma.agent.update).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: { headshotUrl: 'agents/agent-1/headshot/test.png' },
    });
  });
});
