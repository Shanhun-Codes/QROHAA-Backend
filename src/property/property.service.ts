import { Injectable } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPropertyDto: CreatePropertyDto) {
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

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
