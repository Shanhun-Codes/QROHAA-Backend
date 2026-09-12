import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePropertiesDto } from './dto/create-properties.dto';
import { UpdatePropertiesDto } from './dto/update-properties.dto';
import { connect } from 'http2';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(agentId: string, createPropertyDto: CreatePropertiesDto) {
    await this.prisma.property.create({
      data: {
        street: createPropertyDto.street,
        street2: createPropertyDto.street2,
        city: createPropertyDto.city,
        state: createPropertyDto.state,
        zip: createPropertyDto.zip,
        listingPriceCents: createPropertyDto.listingPriceCents,
        agent: {
          connect: {
            id: createPropertyDto.agentId,
          },
        },
      },
    });
    return await this.findAllAgentProperties(agentId);
  }

  findAll() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAgentProperties(agentId: string) {
    return this.prisma.property.findMany({
      where: {
        agentId,
      },
    });
  }
  findPropertyById(id: string) {
    return this.prisma.property.findUnique({ where: { id } });
  }

  update(id: number, updatePropertyDto: UpdatePropertiesDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
