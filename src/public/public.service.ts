import { Injectable } from '@nestjs/common';
import { CreateFeedbackSubmissionDto } from 'src/feedback-submission/dto/create-feedback-submission.dto';
import { FeedbackSubmissionService } from 'src/feedback-submission/feedback-submission.service';
import { PrismaService } from 'src/prisma/prisma.service';

const defaultBranding = {
  primaryColor: '#1E3A5F',
  secondaryColor: '#4F6F8F',
  accentColor: '#D4A853',
};

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    public feedbackSubmissionService: FeedbackSubmissionService,
  ) {}

  findPublicAgentBySlug(slug: string) {
    return this.prisma.agent.findUnique({
      where: { slug },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        brokerageName: true,
        headline: true,
        logoUrl: true,
        headshotUrl: true,
      },
    });
  }

  findOpenHouseByPublicCode(publicCode: string) {
    return this.prisma.openHouse.findUnique({ where: { publicCode } });
  }

  async getConfigurationData(slug: string, publicCode: string) {
    const agentData = await this.prisma.agent.findUnique({
      where: { slug },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        brokerageName: true,
        headline: true,
        logoUrl: true,
        headshotUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
      },
    });

    const openHouseData = await this.prisma.openHouse.findFirst({
      where: { publicCode, agent: { slug } },
      select: {
        publicCode: true,
        startsAt: true,
        endsAt: true,
        property: {
          select: {
            street: true,
            street2: true,
            city: true,
            state: true,
            zip: true,
            listingPriceCents: true,
          },
        },
        openHouseFeedbackQuestions: {
          where: { question: { active: true } },
          orderBy: { sortOrder: 'asc' },
          select: {
            required: true,
            sortOrder: true,
            question: {
              select: {
                id: true,
                key: true,
                label: true,
                type: true,
                category: true,
                options: {
                  orderBy: { sortOrder: 'asc' },
                  select: { label: true, value: true, sortOrder: true },
                },
              },
            },
          },
        },
      },
    });
    return {
      agent: agentData && {
        slug: agentData.slug,
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        email: agentData.email,
        phone: agentData.phone,
        brokerageName: agentData.brokerageName,
        headline: agentData.headline,
        logoUrl: agentData.logoUrl,
        headshotUrl: agentData.headshotUrl,
      },
      branding: {
        primaryColor: agentData?.primaryColor || defaultBranding.primaryColor,
        secondaryColor:
          agentData?.secondaryColor || defaultBranding.secondaryColor,
        accentColor: agentData?.accentColor || defaultBranding.accentColor,
      },
      openHouse: openHouseData && {
        publicCode: openHouseData.publicCode,
        startsAt: openHouseData.startsAt,
        endsAt: openHouseData.endsAt,
      },
      property: openHouseData?.property ?? null,
      feedbackForm: {
        questions:
          openHouseData?.openHouseFeedbackQuestions.map((selection) => ({
            id: selection.question.id,
            key: selection.question.key,
            label: selection.question.label,
            type: selection.question.type,
            category: selection.question.category,
            required: selection.required,
            sortOrder: selection.sortOrder,
            options: selection.question.options,
          })) ?? [],
      },
    };
  }

  async submitFeedback(slug: string, publicCode: string, createFeedbackSubmissionDto: CreateFeedbackSubmissionDto) {
    const verifyOpenHouse = await this.prisma.openHouse.findFirst({
      where: { publicCode, agent: { slug } },
    });
    if (!verifyOpenHouse) {
      throw new Error(
        'Open house not found or not associated with the specified agent.',
      );
    }

    const verifyAgent = await this.prisma.agent.findUnique({
      where: { slug },
    });
    if (!verifyAgent) {
      throw new Error('Agent not found.');
    }

    const verifiedSubmission = verifyOpenHouse && verifyAgent;
    if (verifiedSubmission) {
      const createSubmission = await this.feedbackSubmissionService.create(
        createFeedbackSubmissionDto,
      );
      return { message: 'Feedback submission verified successfully.' };
    }
  }
}
