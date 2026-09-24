import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOpenHousesDto } from './dto/create-open-houses.dto';
import { UpdateOpenHouseDto } from './dto/update-open-houses.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'node:crypto';
import { AgentsService } from 'src/agents/agents.service';

@Injectable()
export class OpenHousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

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
    let selectedQuestions;

    if (createOpenHouseDto.feedbackQuestions) {
      selectedQuestions = createOpenHouseDto.feedbackQuestions.map(
        (question) => ({
          questionId: question.questionId,
          required: question.required,
          sortOrder: question.sortOrder,
          printable: question.printable,
          printableSortOrder: question.printableSortOrder ?? null,
        }),
      );
    } else {
      selectedQuestions = await this.prisma.agentFeedbackQuestion.findMany({
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
          printable: true,
          printableSortOrder: true,
        },

        orderBy: {
          sortOrder: 'asc',
        },
      });
    }

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

  async findOpenHouseDetail(agentId: string, openhouseId: string) {
    const openHouse = await this.prisma.openHouse.findUnique({
      where: {
        id: openhouseId,
        agentId,
      },

      include: {
        property: true,

        agent: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            brokerageName: true,
            headline: true,
            headshotUrl: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },

        openHouseFeedbackQuestions: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: {
                    sortOrder: 'asc',
                  },
                },
              },
            },
          },

          orderBy: {
            sortOrder: 'asc',
          },
        },

        openHouseFeedbackSubmissions: {
          include: {
            feedbackAnswers: true,
            lead: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!openHouse) {
      return null;
    }

    const agent = await this.agentsService.findOne(openHouse.agent.id);

    return {
      ...openHouse,
      agent,
    };
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

    const { feedbackQuestions } = updateOpenHouseDto;

    return this.prisma.$transaction(async (transaction) => {
      if (feedbackQuestions !== undefined) {
        await transaction.openHouseFeedbackQuestion.deleteMany({
          where: {
            openHouseId,
          },
        });

        if (feedbackQuestions.length) {
          await transaction.openHouseFeedbackQuestion.createMany({
            data: feedbackQuestions.map((question) => ({
              openHouseId,
              questionId: question.questionId,
              required: question.required,
              sortOrder: question.sortOrder,
              printable: question.printable,
              printableSortOrder: question.printableSortOrder ?? null,
            })),
          });
        }
      }

      return transaction.openHouse.update({
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
    });
  }

  async removeBulk(agentId: string, openHouseIds: string[]) {
    const deletableOpenHouses = await this.prisma.openHouse.findMany({
      where: {
        agentId,
        id: {
          in: openHouseIds,
        },
        openHouseFeedbackSubmissions: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    const deletableIds = deletableOpenHouses.map((openHouse) => openHouse.id);

    const deletedCount = deletableIds.length;
    const skippedCount = openHouseIds.length - deletedCount;

    if (deletedCount === 0) {
      throw new BadRequestException(
        'No open houses were deleted. They may have associated feedback submissions, which prevents deletion.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.openHouseFeedbackQuestion.deleteMany({
        where: {
          openHouseId: {
            in: deletableIds,
          },
        },
      }),

      this.prisma.openHouse.deleteMany({
        where: {
          agentId,
          id: {
            in: deletableIds,
          },
        },
      }),
    ]);

    return {
      deletedCount,
      skippedCount,
      openHouses: await this.findAllByAgentId(agentId),
    };
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
