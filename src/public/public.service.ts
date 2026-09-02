import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { publicLeadForm } from './config/lead-form.config';
import { SubmitPublicFeedbackDto } from './dto/submit-public-feedback.dto';
import { PublicSubmissionProtectionService } from './public-submission-protection.service';

const defaultBranding = {
  primaryColor: '#1E3A5F',
  secondaryColor: '#4F6F8F',
  accentColor: '#D4A853',
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly submissionProtection: PublicSubmissionProtectionService,
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
                  select: {
                    label: true,
                    value: true,
                    sortOrder: true,
                  },
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
      leadForm: publicLeadForm,
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

  async submitFeedback(
    slug: string,
    publicCode: string,
    submitFeedbackDto: SubmitPublicFeedbackDto,
    ipAddress: string,
    browserToken?: string,
  ) {
    if (submitFeedbackDto.website) {
      throw new BadRequestException(
        'Feedback submission could not be accepted.',
      );
    }

    this.submissionProtection.assertAllowed(
      slug,
      publicCode,
      ipAddress,
      browserToken,
    );

    const openHouse = await this.prisma.openHouse.findFirst({
      where: { publicCode, agent: { slug } },
      select: {
        id: true,
        agentId: true,
        openHouseFeedbackQuestions: {
          select: {
            required: true,
            questionId: true,
            question: {
              select: {
                key: true,
                type: true,
                options: {
                  select: {
                    value: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!openHouse) {
      throw new NotFoundException('Open house not found.');
    }

    const {
      feedbackAnswers,
      website: _website,
      ...leadData
    } = submitFeedbackDto;

    const normalizedLeadData = {
      ...leadData,
      firstName: leadData.firstName?.trim() || null,
      lastName: leadData.lastName?.trim() || null,
      email: leadData.email?.trim().toLowerCase() || null,
      phone: this.normalizePhone(leadData.phone),
    };

    const answerQuestionIds = feedbackAnswers.map(
      (answer) => answer.questionId,
    );

    if (new Set(answerQuestionIds).size !== answerQuestionIds.length) {
      throw new BadRequestException('Each question may only be answered once.');
    }

    const configuredQuestions = new Map(
      openHouse.openHouseFeedbackQuestions.map((selection) => [
        selection.questionId,
        selection,
      ]),
    );

    const missingRequiredQuestion = openHouse.openHouseFeedbackQuestions.find(
      (selection) =>
        selection.required && !answerQuestionIds.includes(selection.questionId),
    );

    if (missingRequiredQuestion) {
      throw new BadRequestException('A required feedback question is missing.');
    }

    for (const answer of feedbackAnswers) {
      const configuredQuestion = configuredQuestions.get(answer.questionId);

      if (!configuredQuestion) {
        throw new BadRequestException(
          'An answer references a question not assigned to this open house.',
        );
      }

      if (configuredQuestion.question.options.length) {
        const validValues = configuredQuestion.question.options.map(
          (option) => option.value,
        );

        if (!validValues.includes(answer.value)) {
          throw new BadRequestException(
            'An answer contains an invalid option value.',
          );
        }
      }
    }

    const hasContact = Boolean(
      normalizedLeadData.email || normalizedLeadData.phone,
    );

    const workingWithAgentQuestion = openHouse.openHouseFeedbackQuestions.find(
      (selection) => selection.question.key === 'working_with_agent',
    );

    const workingWithAgentAnswer = feedbackAnswers.find(
      (answer) => answer.questionId === workingWithAgentQuestion?.questionId,
    );

    const createLead = hasContact && workingWithAgentAnswer?.value !== 'YES';

    const answerFingerprint = JSON.stringify(
      [...feedbackAnswers]
        .sort((left, right) => left.questionId.localeCompare(right.questionId))
        .map(({ questionId, value }) => ({
          questionId,
          value,
        })),
    );

    const { submission, leadAction } = await this.prisma.$transaction(
      async (transaction) => {
        const existingLead = createLead
          ? await transaction.lead.findFirst({
              where: {
                agentId: openHouse.agentId,
                OR: [
                  ...(normalizedLeadData.email
                    ? [{ email: normalizedLeadData.email }]
                    : []),
                  ...(normalizedLeadData.phone
                    ? [{ phone: normalizedLeadData.phone }]
                    : []),
                ],
              },
              select: {
                id: true,
              },
            })
          : null;

        const submission = await transaction.feedbackSubmission.create({
          data: {
            openHouse: {
              connect: {
                id: openHouse.id,
              },
            },
            feedbackAnswers: {
              create: feedbackAnswers,
            },
            ...(createLead && {
              lead: existingLead
                ? {
                    connect: {
                      id: existingLead.id,
                    },
                  }
                : {
                    create: {
                      ...normalizedLeadData,
                      agentId: openHouse.agentId,
                    },
                  },
            }),
          },
          select: {
            id: true,
            leadId: true,
            createdAt: true,
          },
        });

        return {
          submission,
          leadAction: existingLead
            ? 'LEAD_CONTACT_FOUND_AND_REUSED'
            : createLead
              ? 'LEAD_CREATED'
              : 'NO_LEAD_CREATED',
        };
      },
    );

    this.submissionProtection.recordSuccessfulSubmission(
      slug,
      publicCode,
      ipAddress,
      browserToken,
      answerFingerprint,
    );

    return {
      message: 'Feedback submitted successfully.',
      submissionId: submission.id,
      leadAction,
    };
  }

  private normalizePhone(phone?: string | null): string | null {
    if (!phone) {
      return null;
    }

    let digits = phone.trim().replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }

    return digits || null;
  }
}
