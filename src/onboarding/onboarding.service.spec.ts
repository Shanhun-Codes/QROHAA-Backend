import { BadRequestException } from '@nestjs/common';
jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('src/agents/agents.service', () => ({
  AgentsService: class AgentsService {},
}));
jest.mock('src/auth/cognito-auth.service', () => ({
  CognitoAuthService: class CognitoAuthService {},
}));
import { OnboardingService } from './onboarding.service';

const identity = {
  sub: 'cognito-sub-1',
  email: 'agent@example.com',
};
const dto = {
  invitationToken: 'raw-one-time-token',
  firstName: 'Taylor',
  lastName: 'Morgan',
  phone: '4175551234',
  realEstateLicenseNumber: 'AG123456',
  brokerage: {
    name: 'Example Realty',
    licenseNumber: 'BR789012',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'MO',
      zip: '65801',
    },
  },
};

function setup() {
  const invitation = {
    id: 'invite-1',
    email: ' AGENT@example.com ',
    tokenHash: 'stored-hash',
    role: 'AGENT',
    accountType: 'AGENT',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    redeemedAt: null,
  };
  const transaction = {
    invitation: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'user-1' }),
    },
    agent: { create: jest.fn().mockResolvedValue({ id: 'agent-1' }) },
    agency: { create: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    invitation: { findUnique: jest.fn().mockResolvedValue(invitation) },
    feedbackQuestion: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const agents = {
    generateUniqueSlug: jest.fn().mockResolvedValue('taylor-morgan'),
    findProfile: jest.fn().mockResolvedValue({ id: 'agent-1', brokerage: {} }),
  };
  const cognito = {
    verifyInvitationIdentity: jest.fn().mockResolvedValue(identity),
    normalizeEmail: (email: string) => email.trim().toLowerCase(),
  };
  return {
    service: new OnboardingService(
      prisma as never,
      agents as never,
      cognito as never,
    ),
    invitation,
    transaction,
    prisma,
    agents,
    cognito,
  };
}

describe('OnboardingService invitation redemption', () => {
  it('creates the linked agent, user, brokerage, and audit record in one transaction', async () => {
    const { service, transaction, prisma, cognito } = setup();

    const result = await service.redeemInvitation(identity.sub, 'id-token', {
      ...dto,
      role: 'PLATFORM_ADMIN',
      email: 'attacker@example.com',
      agentId: 'another-agent',
    } as never);

    expect(result).toEqual({ id: 'agent-1', brokerage: {} });
    expect(cognito.verifyInvitationIdentity).toHaveBeenCalledWith(
      'id-token',
      identity.sub,
    );
    expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    });
    expect(transaction.invitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'invite-1', redeemedAt: null }),
      }),
    );
    expect(transaction.agent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: identity.email,
          brokerage: expect.objectContaining({ create: expect.any(Object) }),
        }),
      }),
    );
    expect(transaction.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cognitoSub: identity.sub,
          email: identity.email,
          role: 'AGENT',
          status: 'ACTIVE',
          agentId: 'agent-1',
        }),
      }),
    );
    expect(transaction.auditLog.create).toHaveBeenCalled();
  });

  it('rejects an email mismatch before opening the provisioning transaction', async () => {
    const { service, prisma, invitation } = setup();
    invitation.email = 'other@example.com';

    await expect(
      service.redeemInvitation(identity.sub, 'id-token', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects concurrent redemption when the conditional invite claim loses', async () => {
    const { service, transaction, agents } = setup();
    transaction.invitation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.redeemInvitation(identity.sub, 'id-token', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.agent.create).not.toHaveBeenCalled();
    expect(agents.findProfile).not.toHaveBeenCalled();
  });

  it('rejects expired invitations without provisioning', async () => {
    const { service, invitation, prisma } = setup();
    invitation.expiresAt = new Date(Date.now() - 60_000);

    await expect(
      service.redeemInvitation(identity.sub, 'id-token', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects revoked invitations without provisioning', async () => {
    const { service, invitation, prisma } = setup();
    invitation.revokedAt = new Date();

    await expect(
      service.redeemInvitation(identity.sub, 'id-token', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects already-redeemed invitations without provisioning', async () => {
    const { service, invitation, prisma } = setup();
    invitation.redeemedAt = new Date();

    await expect(
      service.redeemInvitation(identity.sub, 'id-token', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
