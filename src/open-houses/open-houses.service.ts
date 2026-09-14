import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOpenHousesDto } from './dto/create-open-houses.dto';
import { UpdateOpenHouseDto } from './dto/update-open-houses.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'node:crypto';
import { connect } from 'node:http2';

@Injectable()
export class OpenHousesService {
  constructor(private prisma: PrismaService) {}

  async create(agentId: string, createOpenHouseDto: CreateOpenHousesDto) {
    const publicCode = await this.generateUniquePublicCode();

    const property = await this.prisma.property.findFirst({
      where: {
        id: createOpenHouseDto.propertyId,
        agentId,
      },
    });

    if (!property) {
      throw new BadRequestException(
        'The selected property does not belong to this agent.',
      );
    }

    const selectedQuestions = await this.prisma.agentFeedbackQuestion.findMany({
      where: {
        agentId,
        active: true,
        question: {
          active: true,
        },
      },
      select: {
        questionId: true,
        required: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    if (!selectedQuestions.length) {
      throw new BadRequestException(
        'The agent must have active feedback questions before creating an open house.',
      );
    }

    return this.prisma.$transaction((transaction) =>
      transaction.openHouse.create({
        data: {
          publicCode,
          startsAt: createOpenHouseDto.startsAt,
          endsAt: createOpenHouseDto.endsAt,

          agent: {
            connect: {
              id: agentId,
            },
          },

          property: {
            connect: {
              id: createOpenHouseDto.propertyId,
            },
          },

          openHouseFeedbackQuestions: {
            createMany: {
              data: selectedQuestions,
            },
          },
        },

        include: {
          property: true,

          openHouseFeedbackQuestions: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      }),
    );
  }

  findAll() {
    return this.prisma.openHouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllByAgentId(id: string) {
    return this.prisma.openHouse.findMany({
      orderBy: { startsAt: 'desc' },
      where: { agentId: id },
      include: { property: true },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} openHouse`;
  }

  async update(
    agentId: string,
    openHouseId: string,
    updateOpenHouseDto: UpdateOpenHouseDto,
  ) {
    const openHouse = await this.prisma.openHouse.findFirst({
      where: {
        id: openHouseId,
        agentId,
      },
    });

    if (!openHouse) {
      throw new BadRequestException('Open house not found for this agent.');
    }

    if (updateOpenHouseDto.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: {
          id: updateOpenHouseDto.propertyId,
          agentId,
        },
      });

      if (!property) {
        throw new BadRequestException(
          'The selected property does not belong to this agent.',
        );
      }
    }

    return this.prisma.openHouse.update({
      where: {
        id: openHouseId,
      },

      data: {
        propertyId: updateOpenHouseDto.propertyId,
        startsAt: updateOpenHouseDto.startsAt,
        endsAt: updateOpenHouseDto.endsAt,
      },

      include: {
        property: true,

        openHouseFeedbackQuestions: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
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
