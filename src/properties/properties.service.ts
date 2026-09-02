import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePropertiesDto } from './dto/create-properties.dto';
import { UpdatePropertiesDto } from './dto/update-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPropertyDto: CreatePropertiesDto) {
    return this.prisma.property.create({
      data: {
        street: createPropertyDto.street,
        street2: createPropertyDto.street2,
        city: createPropertyDto.city,
        state: createPropertyDto.state,
        zip: createPropertyDto.zip,
        listingPriceCents: createPropertyDto.listingPriceCents,
      },
    });
  }

  findAll() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
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
