import { BadRequestException, ForbiddenException } from '@nestjs/common';
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('src/auth/auth-user.service', () => ({ AuthUserService: class {} }));
jest.mock('./invitation-email.service', () => ({
  InvitationEmailService: class {},
}));
import { AgencyService } from './agency.service';
function setup() {
  const agency = { id: 'agency-a', name: 'Agency A', seatLimit: 3 };
  const tx = {
    agency: { update: jest.fn().mockResolvedValue(agency) },
    agent: { count: jest.fn().mockResolvedValue(0) },
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    invitation: {
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'invite-1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    agency: { findUnique: jest.fn().mockResolvedValue(agency) },
    $transaction: jest.fn((fn) => fn(tx)),
  };
  const auth = {
    getApplicationUser: jest
      .fn()
      .mockResolvedValue({ role: 'AGENCY_ADMIN', agencyId: 'agency-a' }),
  };
  const mail = {
    send: jest.fn().mockResolvedValue({ delivery: 'MANUAL', link: null }),
  };
  return {
    service: new AgencyService(prisma as never, auth as never, mail as never),
    tx,
    prisma,
    auth,
    mail,
  };
}
describe('Agency invitations and membership', () => {
  it('denies access to a different agency before reading its data', async () => {
    const { service, prisma } = setup();
    await expect(service.overview('sub', 'agency-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.agency.findUnique).not.toHaveBeenCalled();
  });
  it('reserves a seat, normalizes email, and stores only a token hash', async () => {
    const { service, tx, mail } = setup();
    const result = await service.invite('sub', 'agency-a', {
      email: ' PERSON@example.com ',
    });
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tx.invitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agencyId: 'agency-a',
        email: 'person@example.com',
        role: 'AGENT',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(JSON.stringify(tx.invitation.create.mock.calls)).not.toContain(
      result.token,
      expect.any(Date),
    );
    expect(mail.send).toHaveBeenCalledWith(
      'person@example.com',
      'Agency A',
      result.token,
      expect.any(Date),
    );
  });
  it('rejects a fourth seat when two are occupied and one reserved', async () => {
    const { service, tx, mail } = setup();
    tx.agent.count.mockResolvedValue(2);
    tx.invitation.count.mockResolvedValue(1);
    await expect(
      service.invite('sub', 'agency-a', { email: 'fourth@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.invitation.create).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
    expect(tx.agency.update).toHaveBeenCalled();
  });
  it('rejects an existing application account without changing ownership', async () => {
    const { service, tx } = setup();
    tx.user.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(
      service.invite('sub', 'agency-a', { email: 'existing@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.invitation.create).not.toHaveBeenCalled();
  });
  it('cannot revoke an invitation from another agency', async () => {
    const { service, tx } = setup();
    tx.invitation.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.revoke('sub', 'agency-a', 'foreign-invite'),
    ).rejects.toThrow('unavailable');
    expect(tx.invitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'foreign-invite',
          agencyId: 'agency-a',
        }),
      }),
    );
  });
  it('deactivation can only affect ordinary agents inside the agency', async () => {
    const { service, tx } = setup();
    await service.setStatus('sub', 'agency-a', 'user-1', 'SUSPENDED');
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', agencyId: 'agency-a', role: 'AGENT' },
      data: { status: 'SUSPENDED' },
    });
  });
  it('resending rotates the link without extending expiry or creating another reservation', async () => {
    const { service, tx } = setup();
    const expiry = new Date(Date.now() + 60000);
    tx.invitation.findFirst.mockResolvedValue({
      id: 'invite-1',
      email: 'person@example.com',
      expiresAt: expiry,
    });
    const result = await service.resend('sub', 'agency-a', 'invite-1');
    expect(result.expiresAt).toEqual(expiry);
    expect(tx.invitation.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { tokenHash: expect.any(String) },
    });
    expect(tx.invitation.create).not.toHaveBeenCalled();
  });
});
