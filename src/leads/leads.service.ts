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
    });
  }

  findAll() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({ where: { id } });
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} was not found.`);
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} lead`;
  }
}
