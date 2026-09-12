import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async createAgentForUser(cognitoSub: string, createAgentDto: CreateAgentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        cognitoSub,
      },
      include: {
        agent: true,
      },
    });

    if (existingUser?.agent) {
      throw new BadRequestException('User already has an agent profile');
    }

    const slug = `${createAgentDto.firstName}-${createAgentDto.lastName}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          slug,
          firstName: createAgentDto.firstName,
          lastName: createAgentDto.lastName,
          email: createAgentDto.email,
          phone: createAgentDto.phone,
          brokerageName: createAgentDto.brokerageName,
          headline: createAgentDto.headline,
          logoUrl: createAgentDto.logoUrl,
          headshotUrl: createAgentDto.headshotUrl,
          primaryColor: createAgentDto.primaryColor,
          secondaryColor: createAgentDto.secondaryColor,
          accentColor: createAgentDto.accentColor,
        },
      });

      await tx.user.upsert({
        where: {
          cognitoSub,
        },
        update: {
          email: createAgentDto.email,
          agentId: agent.id,
        },
        create: {
          cognitoSub,
          email: createAgentDto.email,
          agentId: agent.id,
        },
      });

      return agent;
    });
  }
}
