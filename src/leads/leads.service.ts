import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeadStatusType } from 'generated/prisma/enums';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  create(createLeadDto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        firstName: createLeadDto.firstName ?? null,
        lastName: createLeadDto.lastName ?? null,
        email: createLeadDto.email ?? null,
        phone: createLeadDto.phone ?? null,
        agentId: createLeadDto.agentId,
      },
      include: this.leadRelations(),
    });
  }

  findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.leadRelations(),
    });
  }

  findLeadDetail(agentId: string, leadId: string) {
    const selectedFeedbackKeys = [
      'budget_range',
      'pre_qualified',
      'purchase_timeline',
      'neighborhoods',
    ];

    return this.prisma.lead.findUnique({
      where: { agentId: agentId, id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: {
            openHouseId: true,
            createdAt: true,
            feedbackAnswers: {
              where: { question: { key: { in: selectedFeedbackKeys } } },
              select: {
                value: true,
                question: {
                  select: {
                    key: true,
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAllAgentLeads(agentId: string) {
    const newLeads = await this.prisma.lead.findMany({
      where: {
        agentId,
        status: LeadStatusType.NEW,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const otherLeads = await this.prisma.lead.findMany({
      where: {
        agentId,
        status: {
          notIn: [
            LeadStatusType.NEW,
            LeadStatusType.LOST,
            LeadStatusType.CLOSED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return [...newLeads, ...otherLeads];
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: this.leadRelations(),
    });
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} was not found.`);
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
      include: this.leadRelations(),
    });
  }

  remove(id: number) {
    return `This action removes a #${id} lead`;
  }

  async updateLeadStatusFromMultiSelect(
    agentId: string,
    leadIds: string[],
    status: LeadStatusType,
  ) {
    console.log('agentId:', agentId);
    console.log('leadIds:', leadIds);
    console.log('status:', status);

    const result = await this.prisma.lead.updateMany({
      where: {
        agentId,
        id: {
          in: leadIds,
        },
      },
      data: {
        status,
      },
    });

    console.log('UPDATED COUNT:', result.count);

    const leads = await this.findAllAgentLeads(agentId);

    console.log('RETURNED LEADS:', leads);

    return leads;
  }

  private leadRelations() {
    return {
      submissions: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          openHouseId: true,
          createdAt: true,
        },
      },
    };
  }
}
