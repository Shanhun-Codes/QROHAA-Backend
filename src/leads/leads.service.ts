import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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

  findAllLeadsWithSelectedFeedback() {
    const selectedFeedbackKeys = [
      'budget_range',
      'pre_qualified',
      'purchase_timeline',
    ];

    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        agentId: true,
        status: true,
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
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
