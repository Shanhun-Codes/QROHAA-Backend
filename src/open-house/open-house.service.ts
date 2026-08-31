import { Injectable } from '@nestjs/common';
import { CreateOpenHouseDto } from './dto/create-open-house.dto';
import { UpdateOpenHouseDto } from './dto/update-open-house.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'node:crypto';

@Injectable()
export class OpenHouseService {
  constructor(private prisma: PrismaService) {}

  async create(createOpenHouseDto: CreateOpenHouseDto) {
    const publicCode = await this.generateUniquePublicCode();

    return this.prisma.openHouse.create({
      data: {
        publicCode,
        startsAt: createOpenHouseDto.startsAt,
        endsAt: createOpenHouseDto.endsAt,
        agent: { connect: { id: createOpenHouseDto.agentId } },
        property: { connect: { id: createOpenHouseDto.propertyId } },
      },
    });
  }

  findAll() {
    return `This action returns all openHouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} openHouse`;
  }

  update(id: number, updateOpenHouseDto: UpdateOpenHouseDto) {
    return `This action updates a #${id} openHouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} openHouse`;
  }

  private generatePublicCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(8);

    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(
      '',
    );
  }

  private async generateUniquePublicCode(): Promise<string> {
    let publicCode = this.generatePublicCode();

    while (await this.prisma.openHouse.findUnique({ where: { publicCode } })) {
      publicCode = this.generatePublicCode();
    }

    return publicCode;
  }
}
