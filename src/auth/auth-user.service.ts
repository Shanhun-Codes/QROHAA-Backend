import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from 'src/agents/agents.service';

@Injectable()
export class AuthUserService {
  constructor(
    private readonly prisma: PrismaService,
    private agentsService: AgentsService,
  ) {}

  async getAgentByCognitoSub(cognitoSub: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        cognitoSub,
      },
      include: {
        agent: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user is not registered');
    }

    if (!user.agent) {
      throw new UnauthorizedException(
        'Authenticated user is not linked to an agent',
      );
    }

    return user.agent;
  }

  async getUserByCognitoSub(cognitoSub: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        cognitoSub,
      },
      include: {
        agent: true,
      },
    });

    if (!user?.agent) {
      return user;
    }

    const agent = await this.agentsService.findOne(user.agent.id);

    return {
      ...user,
      agent,
    };
  }
}
