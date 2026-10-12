import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AgentsService } from 'src/agents/agents.service';
import { CognitoAuthService } from 'src/auth/cognito-auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedeemInvitationDto } from './dto/redeem-invitation.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly cognitoAuthService: CognitoAuthService,
  ) {}

  async inspectAgencyInvitation(
    cognitoSub: string,
    idToken: string,
    token: string,
  ) {
    const identity = await this.cognitoAuthService.verifyInvitationIdentity(
      idToken,
      cognitoSub,
    );
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashInvitationToken(token) },
      include: { agency: { include: { brokerage: true } } },
    });
    if (
      !invitation?.agency ||
      invitation.revokedAt ||
      invitation.redeemedAt ||
      invitation.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'This invitation has expired, was revoked, or has already been accepted. Ask your agency for a new invitation.',
      );
    }
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { cognitoSub: identity.sub },
          { email: { equals: identity.email, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    return {
      email: invitation.email,
      signedInEmail: identity.email,
      emailMatches:
        this.cognitoAuthService.normalizeEmail(invitation.email) ===
        identity.email,
      existingAccount: Boolean(existing),
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      agency: {
        name: invitation.agency.name,
        brokerage: invitation.agency.brokerage,
      },
    };
  }

  async redeemInvitation(
    cognitoSub: string,
    idToken: string,
    dto: RedeemInvitationDto,
  ) {
    const identity = await this.cognitoAuthService.verifyInvitationIdentity(
      idToken,
      cognitoSub,
    );
    const tokenHash = this.hashInvitationToken(dto.invitationToken);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
    });
    const now = new Date();

    if (
      !invitation ||
      invitation.revokedAt ||
      invitation.redeemedAt ||
      invitation.expiresAt <= now ||
      this.cognitoAuthService.normalizeEmail(invitation.email) !==
        identity.email
    ) {
      throw new BadRequestException('Invitation is invalid or unavailable.');
    }

    if (invitation.accountType === 'AGENT') {
      this.validateAgentDetails(dto, Boolean(invitation.agencyId));
    } else if (!dto.agency?.name?.trim()) {
      throw new BadRequestException('Agency name is required.');
    }

    const defaultQuestions =
      invitation.accountType === 'AGENT'
        ? await this.prisma.feedbackQuestion.findMany({
            where: { active: true },
            select: { id: true },
            orderBy: { key: 'asc' },
          })
        : [];

    const provisioned = await this.prisma.$transaction(async (transaction) => {
      if (invitation.agencyId) {
        const agency = await transaction.agency.update({
          where: { id: invitation.agencyId },
          data: { updatedAt: new Date() },
        });
        const occupied = await transaction.agent.count({
          where: { agencyId: agency.id },
        });
        if (agency.seatLimit !== null && occupied >= agency.seatLimit) {
          throw new BadRequestException(
            'This agency has reached its agent seat limit. Contact your agency administrator.',
          );
        }
      }
      const claimed = await transaction.invitation.updateMany({
        where: {
          id: invitation.id,
          tokenHash,
          revokedAt: null,
          redeemedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          redeemedAt: now,
          redeemedBySub: identity.sub,
        },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException('Invitation is invalid or unavailable.');
      }

      if (
        await transaction.user.findFirst({
          where: {
            OR: [
              { cognitoSub: identity.sub },
              { email: { equals: identity.email, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        })
      ) {
        throw new BadRequestException('This account is already provisioned.');
      }

      let agentId: string | undefined;
      let agencyId: string | undefined = invitation.agencyId ?? undefined;

      if (invitation.accountType === 'AGENT') {
        const slug = await this.agentsService.generateUniqueSlug(
          dto.firstName!.trim(),
          dto.lastName!.trim(),
        );
        const agent = await transaction.agent.create({
          data: {
            slug,
            firstName: dto.firstName!.trim(),
            lastName: dto.lastName!.trim(),
            email: identity.email,
            phone: dto.phone!.trim(),
            realEstateLicenseNumber: dto.realEstateLicenseNumber!.trim(),
            headline: dto.headline?.trim() || null,
            ...(agencyId && { agencyId, brandingLocked: true }),
            logoUrl: agencyId ? null : dto.logoUrl?.trim() || null,
            headshotUrl: dto.headshotUrl?.trim() || null,
            primaryColor: agencyId
              ? null
              : this.normalizeColor(dto.primaryColor),
            secondaryColor: agencyId
              ? null
              : this.normalizeColor(dto.secondaryColor),
            accentColor: agencyId ? null : this.normalizeColor(dto.accentColor),
            agentFeedbackQuestions: {
              create: defaultQuestions.map((question, sortOrder) => ({
                questionId: question.id,
                sortOrder,
              })),
            },
            ...(!agencyId && {
              brokerage: {
                create: {
                  name: dto.brokerage!.name.trim(),
                  licenseNumber: dto.brokerage!.licenseNumber.trim(),
                  phone: dto.brokerage!.phone?.trim() || null,
                  email: dto.brokerage!.email?.trim().toLowerCase() || null,
                  websiteUrl: dto.brokerage!.websiteUrl?.trim() || null,
                  street: dto.brokerage!.address.street.trim(),
                  street2: dto.brokerage!.address.street2?.trim() || null,
                  city: dto.brokerage!.address.city.trim(),
                  state: dto.brokerage!.address.state.trim(),
                  zip: dto.brokerage!.address.zip.trim(),
                },
              },
            }),
          },
          select: { id: true },
        });
        agentId = agent.id;
      } else {
        const agency = await transaction.agency.create({
          data: {
            name: dto.agency!.name.trim(),
            headline: dto.agency!.headline?.trim() || null,
            logoUrl: dto.agency!.logoUrl?.trim() || null,
            primaryColor: this.normalizeColor(dto.agency!.primaryColor),
            secondaryColor: this.normalizeColor(dto.agency!.secondaryColor),
            accentColor: this.normalizeColor(dto.agency!.accentColor),
          },
          select: { id: true },
        });
        agencyId = agency.id;
      }

      await transaction.user.create({
        data: {
          cognitoSub: identity.sub,
          email: identity.email,
          role: invitation.role,
          status: 'ACTIVE',
          ...(agentId && { agentId }),
          ...(agencyId && { agencyId }),
        },
      });

      await transaction.auditLog.create({
        data: {
          actorSub: identity.sub,
          action: 'INVITATION_REDEEMED',
          targetType: 'Invitation',
          targetId: invitation.id,
          metadata: { accountType: invitation.accountType },
        },
      });

      return { agentId, agencyId };
    });

    if (provisioned.agentId) {
      const agent = await this.agentsService.findProfile(provisioned.agentId);
      if (!agent) {
        throw new UnauthorizedException('Unable to load provisioned profile.');
      }
      return agent;
    }

    return {
      hasAgent: false,
      agencyId: provisioned.agencyId,
      accessPending: true,
    };
  }

  private validateAgentDetails(
    dto: RedeemInvitationDto,
    agencyOwned = false,
  ): void {
    const requiredValues = [
      dto.firstName,
      dto.lastName,
      dto.phone,
      dto.realEstateLicenseNumber,
      ...(!agencyOwned
        ? [
            dto.brokerage?.name,
            dto.brokerage?.licenseNumber,
            dto.brokerage?.address?.street,
            dto.brokerage?.address?.city,
            dto.brokerage?.address?.state,
            dto.brokerage?.address?.zip,
          ]
        : []),
    ];
    if (requiredValues.some((value) => !value?.trim())) {
      throw new BadRequestException(
        'Required agent or brokerage details are missing.',
      );
    }
  }

  private hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeColor(color?: string): string | null {
    if (!color?.trim()) return null;
    return color.startsWith('#') ? color : `#${color}`;
  }
}
