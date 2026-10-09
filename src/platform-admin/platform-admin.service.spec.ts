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
