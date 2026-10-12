import 'reflect-metadata';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { AgencyService } from '../src/agency/agency.service';
import { OnboardingService } from '../src/onboarding/onboarding.service';
import { AgentsService } from '../src/agents/agents.service';

async function main() {
  if (
    process.env.NODE_ENV !== 'local' ||
    !['localhost', '127.0.0.1'].includes(process.env.DATABASE_HOST ?? '')
  )
    throw new Error('Only run this check against localhost.');
  const prisma = new PrismaService(new ConfigService());
  const agency = await prisma.agency.create({
    data: {
      name: `Seat verification ${randomUUID()}`,
      seatLimit: 3,
      primaryColor: '#123456',
      logoUrl: null,
      brokerage: { create: { name: 'Verification Brokerage' } },
    },
  });
  const actor = `verification-${randomUUID()}`;
  const invitations: string[] = [];
  try {
    const agencyService = new AgencyService(
      prisma,
      {
        getApplicationUser: async () => ({
          role: 'AGENCY_ADMIN',
          agencyId: agency.id,
        }),
      } as never,
      { send: async () => ({ delivery: 'MANUAL', link: null }) } as never,
    );
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, index) =>
        agencyService.invite(actor, agency.id, {
          email: `seat-${index}-${actor}@example.invalid`,
        }),
      ),
    );
    const accepted = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    invitations.push(...accepted.map((invite) => invite.id));
    assert.equal(
      accepted.length,
      3,
      'Exactly three concurrent reservations must succeed',
    );
    assert.equal(
      results.filter((r) => r.status === 'rejected').length,
      1,
      'The fourth reservation must fail',
    );
    assert.equal(
      await prisma.invitation.count({
        where: { agencyId: agency.id, revokedAt: null },
      }),
      3,
    );
    await agencyService.revoke(actor, agency.id, accepted[0].id);
    const replacement = await agencyService.invite(actor, agency.id, {
      email: `replacement-${actor}@example.invalid`,
    });
    invitations.push(replacement.id);
    const pending = [replacement, ...accepted.slice(1)];
    const agents = new AgentsService(prisma, {
      createReadUrl: async (key: string) => key,
    } as never);
    const redeems = await Promise.all(
      pending.map(async (invite, index) => {
        const identity = { sub: `${actor}-${index}`, email: invite.email };
        const onboarding = new OnboardingService(prisma, agents, {
          verifyInvitationIdentity: async () => identity,
          normalizeEmail: (email: string) => email.trim().toLowerCase(),
        } as never);
        return onboarding.redeemInvitation(
          identity.sub,
          'mock-verified-id-token',
          {
            invitationToken: invite.token,
            firstName: 'Seat',
            lastName: `Tester${index}`,
            phone: '5555550100',
            realEstateLicenseNumber: 'TEST-ONLY',
          },
        );
      }),
    );
    assert.equal(
      await prisma.agent.count({ where: { agencyId: agency.id } }),
      3,
    );
    assert.equal(
      await prisma.user.count({ where: { agencyId: agency.id } }),
      3,
    );
    assert.equal(
      (redeems[0] as { primaryColor: string }).primaryColor,
      '#123456',
      'Branding must resolve from agency',
    );
    assert.equal(
      (redeems[0] as { brokerage: { name: string } }).brokerage.name,
      'Verification Brokerage',
    );
    const extraToken = randomUUID();
    const extra = await prisma.invitation.create({
      data: {
        agencyId: agency.id,
        email: `extra-${actor}@example.invalid`,
        accountType: 'AGENT',
        role: 'AGENT',
        createdBySub: actor,
        tokenHash: createHash('sha256').update(extraToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    invitations.push(extra.id);
    const onboarding = new OnboardingService(prisma, agents, {
      verifyInvitationIdentity: async () => ({
        sub: `${actor}-extra`,
        email: extra.email,
      }),
      normalizeEmail: (email: string) => email,
    } as never);
    await assert.rejects(
      () =>
        onboarding.redeemInvitation(`${actor}-extra`, 'mock-token', {
          invitationToken: extraToken,
          firstName: 'Extra',
          lastName: 'Tester',
          phone: '5555550100',
          realEstateLicenseNumber: 'TEST',
        }),
      /seat limit/,
    );
    assert.equal(
      (await prisma.invitation.findUniqueOrThrow({ where: { id: extra.id } }))
        .redeemedAt,
      null,
    );
    console.log(
      'PASS: four concurrent invitations allow three seats; revocation releases a reservation; three concurrent accepts succeed; a fourth accept is rejected without consuming its invitation; agency branding and brokerage are inherited.',
    );
  } finally {
    const agents = await prisma.agent.findMany({
      where: { agencyId: agency.id },
      select: { id: true },
    });
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({
        where: { targetId: { in: invitations } },
      });
      await tx.user.deleteMany({ where: { agencyId: agency.id } });
      await tx.agentFeedbackQuestion.deleteMany({
        where: { agentId: { in: agents.map((a) => a.id) } },
      });
      await tx.agent.deleteMany({ where: { agencyId: agency.id } });
      await tx.invitation.deleteMany({ where: { agencyId: agency.id } });
      await tx.brokerage.deleteMany({ where: { agencyId: agency.id } });
      await tx.agency.delete({ where: { id: agency.id } });
    });
    await prisma.$disconnect();
  }
}
main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
