jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PlatformAdminService } from './platform-admin.service';

describe('PlatformAdminService invitations', () => {
  it('stores only a token hash and returns the raw token once', async () => {
    const transaction = {
      invitation: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'invite-1',
          ...data,
        })),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new PlatformAdminService(prisma as never);

    const result = await service.createInvitation('platform-admin-sub', {
      email: 'Agent@Example.com',
      accountType: 'AGENT',
    });
    const createData = transaction.invitation.create.mock.calls[0][0].data;

    expect(createData.email).toBe('agent@example.com');
    expect(createData.role).toBe('AGENT');
    expect(createData.accountType).toBe('AGENT');
    expect(createData.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createData.tokenHash).not.toBe(result.token);
    expect(result.token).toHaveLength(43);
    expect(transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorSub: 'platform-admin-sub',
          action: 'INVITATION_CREATED',
        }),
      }),
    );
  });
});

describe('PlatformAdminService role and agency assignment', () => {
  function setup() {
    const user = {
      id: 'u1',
      email: 'agent@example.com',
      role: 'AGENT',
      agencyId: null as string | null,
      agentId: 'a1' as string | null,
    };
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest
          .fn()
          .mockResolvedValue({
            id: 'u1',
            role: 'AGENCY_ADMIN',
            agencyId: 'agency1',
          }),
      },
      agency: {
        create: jest.fn().mockResolvedValue({ id: 'agency1' }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'agency1', seatLimit: 2 }),
        update: jest.fn().mockResolvedValue({}),
      },
      agent: {
        findUnique: jest.fn().mockResolvedValue({ id: 'a1', agencyId: null }),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({}),
      },
      invitation: { count: jest.fn().mockResolvedValue(0) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new PlatformAdminService({
      $transaction: jest.fn((callback) => callback(tx)),
    } as never);
    return { service, tx, user };
  }
  it('creates an agency and promotes the user, linking their existing agent and auditing the change', async () => {
    const { service, tx } = setup();
    await service.updateUserRole('admin', 'u1', {
      role: 'AGENCY_ADMIN',
      agencyName: ' Example Realty ',
    });
    expect(tx.agency.create).toHaveBeenCalledWith({
      data: { name: 'Example Realty' },
    });
    expect(tx.agent.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { agencyId: 'agency1', brandingLocked: true },
    });
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { role: 'AGENCY_ADMIN', agencyId: 'agency1' },
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalled();
  });
  it('assigns an existing agency without creating another', async () => {
    const { service, tx } = setup();
    await service.updateUserRole('admin', 'u1', {
      role: 'AGENCY_ADMIN',
      agencyId: 'agency1',
    });
    expect(tx.agency.create).not.toHaveBeenCalled();
  });
  it('counts reserved seats before assigning an existing agent', async () => {
    const { service, tx } = setup();
    tx.invitation.count.mockResolvedValue(2);
    await expect(
      service.updateUserRole('admin', 'u1', {
        role: 'AGENCY_ADMIN',
        agencyId: 'agency1',
      }),
    ).rejects.toThrow('seat limit');
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('requires an agency for agency administrators', async () => {
    const { service } = setup();
    await expect(
      service.updateUserRole('admin', 'u1', { role: 'AGENCY_ADMIN' }),
    ).rejects.toThrow('must have an agency');
  });
  it('blocks platform administrator changes and cross-agency transfers', async () => {
    const { service, user } = setup();
    user.role = 'PLATFORM_ADMIN';
    await expect(
      service.updateUserRole('admin', 'u1', {
        role: 'AGENCY_ADMIN',
        agencyId: 'agency1',
      }),
    ).rejects.toThrow('Platform administrator');
    user.role = 'AGENT';
    user.agencyId = 'other';
    await expect(
      service.updateUserRole('admin', 'u1', {
        role: 'AGENCY_ADMIN',
        agencyId: 'agency1',
      }),
    ).rejects.toThrow('Transfers');
  });
});
