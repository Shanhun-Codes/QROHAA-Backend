import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeadStatusType, NoteEntityType } from 'generated/prisma/enums';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  create(agentId: string, createLeadDto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        firstName: createLeadDto.firstName ?? null,
        lastName: createLeadDto.lastName ?? null,
        email: createLeadDto.email ?? null,
        phone: createLeadDto.phone ?? null,
        agentId,
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
      'liked_least',
      'liked_most',
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
          notIn: [LeadStatusType.NEW, LeadStatusType.LOST],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return [...newLeads, ...otherLeads];
  }

  async update(agentId: string, id: string, updateLeadDto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, agentId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} was not found.`);
    }

    return this.prisma.lead.update({
      where: { id, agentId },
      data: updateLeadDto,
      include: this.leadRelations(),
    });
  }

  async updateLeadStatusFromMultiSelect(
    agentId: string,
    leadIds: string[],
    status: LeadStatusType,
  ) {
    const uniqueLeadIds = [...new Set(leadIds)];
    if (!uniqueLeadIds.length) {
      return this.findAllAgentLeads(agentId);
    }

    await this.prisma.$transaction(async (tx) => {
      const ownedLeads = await tx.lead.findMany({
        where: {
          agentId,
          id: {
            in: uniqueLeadIds,
          },
        },
        select: { id: true },
      });

      if (ownedLeads.length !== uniqueLeadIds.length) {
        throw new NotFoundException('One or more leads were not found.');
      }

      await tx.lead.updateMany({
        where: {
          agentId,
          id: { in: uniqueLeadIds },
        },
        data: {
          updatedAt: new Date(),
          status,
        },
      });

      await tx.note.createMany({
        data: ownedLeads.map(({ id: leadId }) => ({
          agentId,
          subjectType: NoteEntityType.LEAD,
          subjectId: leadId,
          body: `Status updated to ${status}`,
        })),
      });
    });

    const leads = await this.findAllAgentLeads(agentId);

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
