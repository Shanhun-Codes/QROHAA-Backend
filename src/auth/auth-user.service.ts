import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.user.findUnique({
      where: {
        cognitoSub,
      },
      include: {
        agent: true,
      },
    });
  }
}
