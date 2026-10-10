import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrokerageDto } from './dto/create-brokerage.dto';
import { UpdateBrokerageDto } from './dto/update-brokerage.dto';

@Injectable()
export class BrokerageService {
  constructor(private readonly prisma: PrismaService) {}

  // Agency-managed agents see the agency brokerage; others see their own.
  async findForAgent(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { agencyId: true, brandingLocked: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.agencyId && agent.brandingLocked) {
      return this.prisma.brokerage.findUnique({
        where: { agencyId: agent.agencyId },
      });
    }

    return this.prisma.brokerage.findUnique({ where: { agentId } });
  }

  async create(agentId: string, dto: CreateBrokerageDto) {
    await this.assertEditable(agentId);

    return this.prisma.brokerage.upsert({
      where: { agentId },
      create: { ...dto, agentId },
      update: dto,
    });
  }

  async update(agentId: string, dto: UpdateBrokerageDto) {
    await this.assertEditable(agentId);

    const existing = await this.prisma.brokerage.findUnique({
      where: { agentId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Brokerage not found');
    }

    return this.prisma.brokerage.update({
      where: { agentId },
      data: dto,
    });
  }

  private async assertEditable(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { brandingLocked: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.brandingLocked) {
      throw new ForbiddenException('Brokerage is managed by your agency');
    }
  }
}
