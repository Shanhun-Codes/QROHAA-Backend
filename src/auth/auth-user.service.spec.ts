import { ForbiddenException } from '@nestjs/common';
jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('src/agents/agents.service', () => ({
  AgentsService: class AgentsService {},
}));
import { AuthUserService } from './auth-user.service';

describe('AuthUserService access decisions', () => {
  const activeAccess = {
    status: 'ACTIVE',
    startsAt: new Date(Date.now() - 60_000),
    expiresAt: null,
    revokedAt: null,
  };

  function createService(user: Record<string, unknown> | null) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      agent: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const agents = {};
    return {
      service: new AuthUserService(prisma as never, agents as never),
      prisma,
    };
  }

  it('allows an active agent with a current individual entitlement', async () => {
    const { service } = createService({
      id: 'user-1',
      role: 'AGENT',
      status: 'ACTIVE',
      agent: { id: 'agent-1' },
      entitlements: [activeAccess],
      agency: null,
    });

    await expect(service.getAgentByCognitoSub('sub-1')).resolves.toEqual({
      id: 'agent-1',
    });
  });

  it('allows platform administrators without a paid or beta entitlement', async () => {
    const { service } = createService({
      id: 'admin-1',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      entitlements: [],
      agency: null,
    });

    await expect(
      service.requirePlatformAdmin('admin-sub'),
    ).resolves.toMatchObject({
      role: 'PLATFORM_ADMIN',
    });
  });

  it('denies suspended accounts even when entitlement is current', async () => {
    const { service } = createService({
      id: 'user-1',
      role: 'AGENT',
      status: 'SUSPENDED',
      agent: { id: 'agent-1' },
      entitlements: [activeAccess],
      agency: null,
    });

    await expect(service.getAgentByCognitoSub('sub-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies expired beta access based on expiresAt', async () => {
    const { service } = createService({
      id: 'user-1',
      role: 'AGENT',
      status: 'ACTIVE',
      agent: { id: 'agent-1' },
      entitlements: [
        { ...activeAccess, expiresAt: new Date(Date.now() - 1_000) },
      ],
      agency: null,
    });

    await expect(service.getAgentByCognitoSub('sub-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies agent access for another role', async () => {
    const { service } = createService({
      id: 'agency-user',
      role: 'AGENCY_ADMIN',
      status: 'ACTIVE',
      agent: null,
      entitlements: [activeAccess],
      agency: null,
    });

    await expect(service.getAgentByCognitoSub('sub-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts an agency-level entitlement for an agency administrator', async () => {
    const { service } = createService({
      id: 'agency-user',
      agencyId: 'agency-1',
      role: 'AGENCY_ADMIN',
      status: 'ACTIVE',
      agent: null,
      entitlements: [],
      agency: { entitlements: [activeAccess] },
    });

    await expect(
      service.requireAgencyAdmin('agency-sub'),
    ).resolves.toMatchObject({
      agencyId: 'agency-1',
    });
  });

  it('denies an agent outside the specified agency', async () => {
    const { service, prisma } = createService(null);

    await expect(
      service.assertAgencyOwnsAgent('agency-a', 'agent-owned-by-b'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.agent.findFirst).toHaveBeenCalledWith({
      where: { id: 'agent-owned-by-b', agencyId: 'agency-a' },
      select: { id: true },
    });
  });
});
