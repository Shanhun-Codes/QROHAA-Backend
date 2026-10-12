import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AuthUserService } from 'src/auth/auth-user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteAgencyMemberDto } from './dto/invite-agency-member.dto';
import { InvitationEmailService } from './invitation-email.service';

@Injectable()
export class AgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthUserService,
    private readonly mail: InvitationEmailService,
  ) {}

  async authorize(sub: string, agencyId: string) {
    const user = await this.auth.getApplicationUser(sub);
    if (
      user.role !== 'PLATFORM_ADMIN' &&
      (user.role !== 'AGENCY_ADMIN' || user.agencyId !== agencyId)
    ) {
      throw new ForbiddenException(
        'Agency administrator access is required for this agency.',
      );
    }
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });
    if (!agency) throw new NotFoundException('Agency not found.');
    return agency;
  }
  async listAgencies(sub: string) {
    const user = await this.auth.getApplicationUser(sub);
    if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'AGENCY_ADMIN')
      throw new ForbiddenException();
    return this.prisma.agency.findMany({
      where:
        user.role === 'PLATFORM_ADMIN'
          ? {}
          : { id: user.agencyId ?? '__none__' },
      select: { id: true, name: true, seatLimit: true },
      orderBy: { name: 'asc' },
    });
  }
  async overview(sub: string, agencyId: string) {
    const agency = await this.authorize(sub, agencyId);
    const [members, invitations, usedSeats] = await Promise.all([
      this.prisma.user.findMany({
        where: { agencyId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          agent: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invitation.findMany({
        where: { agencyId },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          revokedAt: true,
          redeemedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agent.count({ where: { agencyId } }),
    ]);
    const reservedSeats = invitations.filter(
      (invite) =>
        !invite.revokedAt &&
        !invite.redeemedAt &&
        invite.expiresAt > new Date(),
    ).length;
    return { agency, members, invitations, usedSeats, reservedSeats };
  }
  async invite(sub: string, agencyId: string, dto: InviteAgencyMemberDto) {
    const agency = await this.authorize(sub, agencyId);
    const email = dto.email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const invitation = await this.prisma.$transaction(async (tx) => {
      // Updating the agency locks the row until commit. Redemption uses the same lock.
      const locked = await tx.agency.update({
        where: { id: agencyId },
        data: { updatedAt: new Date() },
      });
      if (
        await tx.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        })
      )
        throw new BadRequestException(
          'This email already has an application account. Existing-account transfers require a separate review.',
        );
      if (
        await tx.invitation.findFirst({
          where: {
            agencyId,
            email,
            revokedAt: null,
            redeemedAt: null,
            expiresAt: { gt: new Date() },
          },
        })
      )
        throw new BadRequestException(
          'An active invitation already exists. Use Resend or revoke it first.',
        );
      const used = await tx.agent.count({ where: { agencyId } });
      const reserved = await tx.invitation.count({
        where: {
          agencyId,
          revokedAt: null,
          redeemedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (locked.seatLimit !== null && used + reserved >= locked.seatLimit)
        throw new BadRequestException(
          'Agency seat limit reached. Revoke an unused invitation or contact your platform administrator.',
        );
      const created = await tx.invitation.create({
        data: {
          agencyId,
          email,
          role: dto.role ?? 'AGENT',
          accountType: 'AGENT',
          tokenHash: createHash('sha256').update(token).digest('hex'),
          createdBySub: sub,
          expiresAt,
        },
      });
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_INVITATION_CREATED',
          targetType: 'Invitation',
          targetId: created.id,
          metadata: { agencyId },
        },
      });
      return { id: created.id, email, expiresAt };
    });
    return {
      ...invitation,
      token,
      ...(await this.mail.send(email, agency.name, token, expiresAt)),
    };
  }
  async revoke(sub: string, agencyId: string, id: string) {
    await this.authorize(sub, agencyId);
    return this.prisma.$transaction(async (tx) => {
      await tx.agency.update({
        where: { id: agencyId },
        data: { updatedAt: new Date() },
      });
      const result = await tx.invitation.updateMany({
        where: { id, agencyId, redeemedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count !== 1)
        throw new NotFoundException('Invitation is unavailable.');
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_INVITATION_REVOKED',
          targetType: 'Invitation',
          targetId: id,
          metadata: { agencyId },
        },
      });
      return { revoked: true };
    });
  }
  async resend(sub: string, agencyId: string, id: string) {
    const agency = await this.authorize(sub, agencyId);
    const token = randomBytes(32).toString('base64url');
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.agency.update({
        where: { id: agencyId },
        data: { updatedAt: new Date() },
      });
      const invite = await tx.invitation.findFirst({
        where: {
          id,
          agencyId,
          redeemedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!invite)
        throw new BadRequestException(
          'Only a pending, unexpired invitation can be resent. Create a new invitation instead.',
        );
      await tx.invitation.update({
        where: { id },
        data: { tokenHash: createHash('sha256').update(token).digest('hex') },
      });
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_INVITATION_RESENT',
          targetType: 'Invitation',
          targetId: id,
          metadata: { agencyId },
        },
      });
      return { id, email: invite.email, expiresAt: invite.expiresAt };
    });
    return {
      ...result,
      token,
      ...(await this.mail.send(
        result.email,
        agency.name,
        token,
        result.expiresAt,
      )),
    };
  }
  async setStatus(
    sub: string,
    agencyId: string,
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ) {
    await this.authorize(sub, agencyId);
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, agencyId, role: 'AGENT' },
        data: { status },
      });
      if (result.count !== 1)
        throw new BadRequestException(
          'Only agent accounts in this agency can be activated or deactivated here.',
        );
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_MEMBER_STATUS_CHANGED',
          targetType: 'User',
          targetId: id,
          metadata: { agencyId, status },
        },
      });
      return { status };
    });
  }
}
