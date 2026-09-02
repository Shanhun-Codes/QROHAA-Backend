import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgentFeedbackQuestionSelectionDto } from './dto/replace-agent-feedback-questions.dto';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAgentDto: CreateAgentDto) {
    const slug = await this.generateUniqueSlug(
      createAgentDto.firstName,
      createAgentDto.lastName,
    );

    const defaultQuestions = await this.prisma.feedbackQuestion.findMany({
      where: { active: true },
      select: { id: true },
      orderBy: { key: 'asc' },
    });

    return this.prisma.$transaction((transaction) =>
      transaction.agent.create({
        data: {
          slug,
          firstName: createAgentDto.firstName,
          lastName: createAgentDto.lastName,
          email: createAgentDto.email,
          phone: createAgentDto.phone,
          brokerageName: createAgentDto.brokerageName ?? null,
          headline: createAgentDto.headline ?? '',
          logoUrl: createAgentDto.logoUrl ?? '',
          headshotUrl: createAgentDto.headshotUrl ?? '',
          primaryColor: this.normalizeHexColor(createAgentDto.primaryColor),
          secondaryColor: this.normalizeHexColor(createAgentDto.secondaryColor),
          accentColor: this.normalizeHexColor(createAgentDto.accentColor),
          agentFeedbackQuestions: {
            create: defaultQuestions.map((question, sortOrder) => ({
              questionId: question.id,
              sortOrder,
            })),
          },
        },
        include: {
          agentFeedbackQuestions: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    );
  }

  findAll() {
    return this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
    });
  }

  async getFeedbackQuestions(agentId: string) {
    await this.ensureAgentExists(agentId);
    return this.prisma.agentFeedbackQuestion.findMany({
      where: { agentId, question: { active: true } },
      orderBy: { sortOrder: 'asc' },
      include: {
        question: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
      },
    });
  }

  async replaceFeedbackQuestions(
    agentId: string,
    selections: AgentFeedbackQuestionSelectionDto[],
  ) {
    await this.ensureAgentExists(agentId);
    const questionIds = selections.map((selection) => selection.questionId);
    const sortOrders = selections.map((selection) => selection.sortOrder);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException(
        'Each feedback question may only be selected once.',
      );
    }
    if (
      new Set(sortOrders).size !== sortOrders.length ||
      sortOrders.some((sortOrder) => sortOrder < 0)
    ) {
      throw new BadRequestException(
        'Sort orders must be unique non-negative integers.',
      );
    }
    const activeQuestionCount = await this.prisma.feedbackQuestion.count({
      where: { id: { in: questionIds }, active: true },
    });
    if (activeQuestionCount !== questionIds.length) {
      throw new BadRequestException(
        'Every selected feedback question must exist and be active.',
      );
    }
    return this.prisma.$transaction(async (transaction) => {
      await transaction.agentFeedbackQuestion.deleteMany({
        where: { agentId },
      });
      if (selections.length) {
        await transaction.agentFeedbackQuestion.createMany({
          data: selections.map((selection) => ({ agentId, ...selection })),
        });
      }
      return transaction.agentFeedbackQuestion.findMany({
        where: { agentId },
        orderBy: { sortOrder: 'asc' },
        include: {
          question: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
        },
      });
    });
  }

  async update(id: string, updateAgentDto: UpdateAgentDto) {
    await this.ensureAgentExists(id);
    const { primaryColor, secondaryColor, accentColor, ...agentData } =
      updateAgentDto;

    return this.prisma.agent.update({
      where: { id },
      data: {
        ...agentData,
        ...(primaryColor !== undefined && {
          primaryColor: this.normalizeHexColor(primaryColor),
        }),
        ...(secondaryColor !== undefined && {
          secondaryColor: this.normalizeHexColor(secondaryColor),
        }),
        ...(accentColor !== undefined && {
          accentColor: this.normalizeHexColor(accentColor),
        }),
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} agent`;
  }

  private generateSlug(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(firstName, lastName);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.agent.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private async ensureAgentExists(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) throw new NotFoundException(`Agent ${agentId} was not found.`);
  }

  private normalizeHexColor(color?: string): string | null {
    if (!color) return null;
    return color.startsWith('#') ? color : `#${color}`;
  }
}
