import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from 'src/agents/agents.service';

@Injectable()
export class AuthUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

  async getApplicationUser(cognitoSub: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
      include: {
        agent: true,
        entitlements: true,
        agency: { include: { entitlements: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user is not registered');
    }

    if (String(user.status) !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active.');
    }

    if (String(user.role) !== 'PLATFORM_ADMIN' && !this.hasEntitlement(user)) {
      throw new ForbiddenException('An active access entitlement is required.');
    }

    return user;
  }

  async getAgentByCognitoSub(cognitoSub: string) {
    const user = await this.getApplicationUser(cognitoSub);

    const isAgent = String(user.role) === 'AGENT';
    const isPlatformAdmin = String(user.role) === 'PLATFORM_ADMIN';

    if ((!isAgent && !isPlatformAdmin) || !user.agent) {
      throw new ForbiddenException('Agent access is required.');
    }

    return user.agent;
  }

  async requirePlatformAdmin(cognitoSub: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user is not registered');
    }

    if (
      String(user.status) !== 'ACTIVE' ||
      String(user.role) !== 'PLATFORM_ADMIN'
    ) {
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    }

    return user;
  }

  async requireAgencyAdmin(cognitoSub: string) {
    const user = await this.getApplicationUser(cognitoSub);

    if (String(user.role) !== 'AGENCY_ADMIN' || !user.agencyId) {
      throw new ForbiddenException('Agency administrator access is required.');
    }

    return user;
  }

  async assertAgencyOwnsAgent(agencyId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, agencyId },
      select: { id: true },
    });

    if (!agent) {
      throw new ForbiddenException('Agent is outside this agency.');
    }

    return agent;
  }

  async getUserByCognitoSub(cognitoSub: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
      include: {
        agent: true,
        entitlements: true,
        agency: { include: { entitlements: true } },
      },
    });

    if (!user) {
      return null;
    }

    const role = String(user.role);
    const status = String(user.status);
    const isActive = status === 'ACTIVE';
    const isPlatformAdmin = role === 'PLATFORM_ADMIN';

    const accessGranted =
      isActive && (isPlatformAdmin || this.hasEntitlement(user));

    if (!accessGranted) {
      return {
        role,
        status,
        accessGranted: false,
        accessStatus: !isActive ? status : 'NO_ENTITLEMENT',
        agent: null,
      };
    }

    if (isPlatformAdmin) {
      return {
        role,
        status,
        accessGranted: true,
        agent: user.agent
          ? await this.agentsService.findProfile(user.agent.id)
          : null,
      };
    }

    if (role !== 'AGENT' || !user.agent) {
      return {
        role,
        status,
        accessGranted: false,
        accessStatus: 'ROLE_UNSUPPORTED',
        agent: null,
      };
    }

    const agent = await this.agentsService.findProfile(user.agent.id);

    return {
      role,
      status,
      accessGranted: true,
      agent,
    };
  }

  private hasEntitlement(user: {
    entitlements: Array<{
      status: string;
      startsAt: Date;
      expiresAt: Date | null;
      revokedAt: Date | null;
    }>;
    agency: {
      entitlements: Array<{
        status: string;
        startsAt: Date;
        expiresAt: Date | null;
        revokedAt: Date | null;
      }>;
    } | null;
  }): boolean {
    const now = new Date();

    const entitlements = [
      ...user.entitlements,
      ...(user.agency?.entitlements ?? []),
    ];

    return entitlements.some(
      (entitlement) =>
        entitlement.status === 'ACTIVE' &&
        entitlement.revokedAt === null &&
        entitlement.startsAt <= now &&
        (entitlement.expiresAt === null || entitlement.expiresAt > now),
    );
  }
}
