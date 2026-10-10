"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
const lead_form_config_1 = require("./config/lead-form.config");
const public_submission_protection_service_1 = require("./public-submission-protection.service");
const agents_service_1 = require("src/agents/agents.service");
const publicBrokerageSelect = {
    name: true,
    licenseNumber: true,
    street: true,
    street2: true,
    city: true,
    state: true,
    zip: true,
};
const defaultBranding = {
    primaryColor: '#1E3A5F',
    secondaryColor: '#4F6F8F',
    accentColor: '#D4A853',
};
let PublicService = class PublicService {
    prisma;
    submissionProtection;
    agentService;
    constructor(prisma, submissionProtection, agentService) {
        this.prisma = prisma;
        this.submissionProtection = submissionProtection;
        this.agentService = agentService;
    }
    findPublicAgentBySlug(slug) {
        return this.prisma.agent.findUnique({
            where: { slug },
            select: {
                slug: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                brokerage: { select: publicBrokerageSelect },
                headline: true,
                logoUrl: true,
                headshotUrl: true,
            },
        });
    }
    findOpenHouseByPublicCode(publicCode) {
        return this.prisma.openHouse.findUnique({
            where: { publicCode },
        });
    }
    async getConfigurationData(slug, publicCode) {
        const agentData = await this.prisma.agent.findUnique({
            where: { slug },
            select: {
                slug: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                realEstateLicenseNumber: true,
                brokerage: { select: publicBrokerageSelect },
                headline: true,
                logoUrl: true,
                headshotUrl: true,
                primaryColor: true,
                secondaryColor: true,
                accentColor: true,
            },
        });
        const agent = agentData
            ? await this.agentService.withAssetUrls(agentData)
            : null;
        const openHouseData = await this.prisma.openHouse.findFirst({
            where: {
                publicCode,
                agent: {
                    slug,
                },
            },
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
                    where: {
                        question: {
                            active: true,
                        },
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
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
                                    orderBy: {
                                        sortOrder: 'asc',
                                    },
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
            agent: agent && {
                slug: agent.slug,
                firstName: agent.firstName,
                lastName: agent.lastName,
                email: agent.email,
                phone: agent.phone,
                realEstateLicenseNumber: agent.realEstateLicenseNumber,
                brokerage: agent.brokerage,
                headline: agent.headline,
                logoUrl: agent.logoUrl,
                headshotUrl: agent.headshotUrl,
            },
            branding: {
                primaryColor: agentData?.primaryColor || defaultBranding.primaryColor,
                secondaryColor: agentData?.secondaryColor || defaultBranding.secondaryColor,
                accentColor: agentData?.accentColor || defaultBranding.accentColor,
            },
            openHouse: openHouseData && {
                publicCode: openHouseData.publicCode,
                startsAt: openHouseData.startsAt,
                endsAt: openHouseData.endsAt,
            },
            property: openHouseData?.property ?? null,
            leadForm: lead_form_config_1.publicLeadForm,
            feedbackForm: {
                questions: openHouseData?.openHouseFeedbackQuestions.map((selection) => ({
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
    async submitFeedback(slug, publicCode, submitFeedbackDto, ipAddress, browserToken) {
        if (submitFeedbackDto.website) {
            throw new common_1.BadRequestException('Feedback submission could not be accepted.');
        }
        this.submissionProtection.assertAllowed(slug, publicCode, ipAddress, browserToken);
        const openHouse = await this.prisma.openHouse.findFirst({
            where: {
                publicCode,
                agent: {
                    slug,
                },
            },
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
            throw new common_1.NotFoundException('Open house not found.');
        }
        const { feedbackAnswers, website: _website, ...leadData } = submitFeedbackDto;
        const normalizedLeadData = {
            ...leadData,
            firstName: leadData.firstName?.trim() || null,
            lastName: leadData.lastName?.trim() || null,
            email: leadData.email?.trim().toLowerCase() || null,
            phone: this.normalizePhone(leadData.phone),
        };
        const answerQuestionIds = feedbackAnswers.map((answer) => answer.questionId);
        if (new Set(answerQuestionIds).size !== answerQuestionIds.length) {
            throw new common_1.BadRequestException('Each question may only be answered once.');
        }
        const configuredQuestions = new Map(openHouse.openHouseFeedbackQuestions.map((selection) => [
            selection.questionId,
            selection,
        ]));
        const missingRequiredQuestion = openHouse.openHouseFeedbackQuestions.find((selection) => selection.required && !answerQuestionIds.includes(selection.questionId));
        if (missingRequiredQuestion) {
            throw new common_1.BadRequestException('A required feedback question is missing.');
        }
        for (const answer of feedbackAnswers) {
            const configuredQuestion = configuredQuestions.get(answer.questionId);
            if (!configuredQuestion) {
                throw new common_1.BadRequestException('An answer references a question not assigned to this open house.');
            }
            if (configuredQuestion.question.options.length) {
                const validValues = configuredQuestion.question.options.map((option) => option.value);
                if (!validValues.includes(answer.value)) {
                    throw new common_1.BadRequestException('An answer contains an invalid option value.');
                }
            }
        }
        const hasContact = Boolean(normalizedLeadData.email || normalizedLeadData.phone);
        const workingWithAgentQuestion = openHouse.openHouseFeedbackQuestions.find((selection) => selection.question.key === 'working_with_agent');
        const workingWithAgentAnswer = feedbackAnswers.find((answer) => answer.questionId === workingWithAgentQuestion?.questionId);
        const shouldCreateNewLead = hasContact && workingWithAgentAnswer?.value !== 'YES';
        const answerFingerprint = JSON.stringify([...feedbackAnswers]
            .sort((left, right) => left.questionId.localeCompare(right.questionId))
            .map(({ questionId, value }) => ({
            questionId,
            value,
        })));
        const { submission, leadAction } = await this.prisma.$transaction(async (transaction) => {
            const existingLead = hasContact
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
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                })
                : null;
            if (existingLead) {
                await transaction.lead.update({
                    where: {
                        id: existingLead.id,
                    },
                    data: {
                        firstName: existingLead.firstName ?? normalizedLeadData.firstName,
                        lastName: existingLead.lastName ?? normalizedLeadData.lastName,
                        email: existingLead.email ?? normalizedLeadData.email,
                        phone: existingLead.phone ?? normalizedLeadData.phone,
                    },
                });
            }
            const shouldAttachLead = Boolean(existingLead) || shouldCreateNewLead;
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
                    ...(shouldAttachLead && {
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
                    : shouldCreateNewLead
                        ? 'LEAD_CREATED'
                        : 'NO_LEAD_CREATED',
            };
        });
        this.submissionProtection.recordSuccessfulSubmission(slug, publicCode, ipAddress, browserToken, answerFingerprint);
        return {
            message: 'Feedback submitted successfully.',
            submissionId: submission.id,
            leadAction,
        };
    }
    normalizePhone(phone) {
        if (!phone) {
            return null;
        }
        let digits = phone.trim().replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('1')) {
            digits = digits.slice(1);
        }
        return digits || null;
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        public_submission_protection_service_1.PublicSubmissionProtectionService,
        agents_service_1.AgentsService])
], PublicService);
//# sourceMappingURL=public.service.js.map