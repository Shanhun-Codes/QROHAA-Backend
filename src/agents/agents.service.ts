import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgentFeedbackQuestionSelectionDto } from './dto/replace-agent-feedback-questions.dto';
import { StorageService } from 'src/storage/storage.service';
import { CreateOnboardingAgentDto } from 'src/onboarding/dto/create-onboarding-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createAgentDto: CreateAgentDto & Partial<CreateOnboardingAgentDto>,
  ) {
    const { brokerage } = createAgentDto;
    const slug = await this.generateUniqueSlug(
      createAgentDto.firstName,
      createAgentDto.lastName,
    );

    const defaultQuestions = await this.prisma.feedbackQuestion.findMany({
      where: { active: true },
      select: { id: true },
      orderBy: { key: 'asc' },
    });

    const agent = await this.prisma.$transaction((transaction) =>
      transaction.agent.create({
        data: {
          slug,
          firstName: createAgentDto.firstName,
          lastName: createAgentDto.lastName,
          email: createAgentDto.email,
          phone: createAgentDto.phone,
          realEstateLicenseNumber: createAgentDto.realEstateLicenseNumber,
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
          ...(brokerage && {
            brokerage: {
              create: {
                name: brokerage.name,
                licenseNumber: brokerage.licenseNumber,
                phone: brokerage.phone,
                email: brokerage.email,
                websiteUrl: brokerage.websiteUrl,
                ...brokerage.address,
              },
            },
          }),
        },
        select: { id: true },
      }),
    );

    const profile = await this.findProfile(agent.id);

    if (!profile) {
      throw new NotFoundException('Agent not found.');
    }

    return profile;
  }

  // Client-facing agent shape: no legacy or internal columns.
  async findProfile(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      omit: {
        brokerageName: true,
        agencyId: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        brokerage: {
          omit: {
            agentId: true,
            agencyId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return agent ? this.withAssetUrls(agent) : null;
  }

  findAll() {
    return this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { brokerage: true },
    });

    if (!agent) {
      return null;
    }

    return this.withAssetUrls(agent);
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
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      brokerage,
      ...agentData
    } = updateAgentDto;

    const brokerageUpdate = brokerage
      ? await this.buildBrokerageUpdate(id, brokerage)
      : undefined;

    await this.prisma.agent.update({
      where: { id },
      data: {
        ...agentData,
        ...(brokerageUpdate && { brokerage: brokerageUpdate }),
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

    return this.findProfile(id);
  }

  remove(id: number) {
    return `This action removes a #${id} agent`;
  }

  private async buildBrokerageUpdate(
    agentId: string,
    brokerage: NonNullable<UpdateAgentDto['brokerage']>,
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { brandingLocked: true, brokerage: { select: { id: true } } },
    });

    if (agent?.brandingLocked) {
      throw new ForbiddenException('Brokerage is managed by your agency.');
    }

    const { address, ...fields } = brokerage;
    const data = { ...fields, ...address };

    if (agent?.brokerage) {
      return { update: data };
    }

    if (!brokerage.name) {
      throw new BadRequestException('Brokerage name is required.');
    }

    return { create: { ...data, name: brokerage.name } };
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

  async completeAssetUpload(
    agentId: string,
    type: 'headshot' | 'logo',
    key: string,
  ) {
    if (!this.storageService.validateAgentAssetKey(agentId, type, key)) {
      throw new BadRequestException('Invalid asset key.');
    }

    const agent = await this.prisma.agent.findUnique({
      where: {
        id: agentId,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }

    const previousKey = type === 'headshot' ? agent.headshotUrl : agent.logoUrl;

    await this.prisma.agent.update({
      where: {
        id: agentId,
      },
      data: type === 'headshot' ? { headshotUrl: key } : { logoUrl: key },
    });

    if (previousKey && previousKey !== key) {
      await this.storageService.delete(previousKey);
    }

    return this.findProfile(agentId);
  }

  public async withAssetUrls<
    T extends {
      logoUrl: string | null;
      headshotUrl: string | null;
    },
  >(agent: T): Promise<T> {
    const [logoUrl, headshotUrl] = await Promise.all([
      agent.logoUrl ? this.storageService.createReadUrl(agent.logoUrl) : null,

      agent.headshotUrl
        ? this.storageService.createReadUrl(agent.headshotUrl)
        : null,
    ]);

    return {
      ...agent,
      logoUrl,
      headshotUrl,
    };
  }
}
