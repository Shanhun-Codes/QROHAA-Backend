import { BadRequestException, Injectable } from '@nestjs/common';

import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

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

    const agent = await this.agentsService.create(createAgentDto);

    await this.prisma.user.upsert({
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
  }
}
