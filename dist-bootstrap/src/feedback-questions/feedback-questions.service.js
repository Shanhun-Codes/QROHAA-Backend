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
exports.FeedbackQuestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
let FeedbackQuestionsService = class FeedbackQuestionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createFeedbackQuestionDto) {
        const { options, ...question } = createFeedbackQuestionDto;
        return this.prisma.feedbackQuestion.create({
            data: {
                ...question,
                options: options ? { createMany: { data: options } } : undefined,
            },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
    }
    findAll() {
        return this.prisma.feedbackQuestion.findMany({
            include: { options: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { key: 'asc' },
        });
    }
    async findOne(id) {
        const question = await this.prisma.feedbackQuestion.findUnique({
            where: { id },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!question)
            throw new common_1.NotFoundException(`Feedback question ${id} was not found.`);
        return question;
    }
    async update(id, dto) {
        const { options, ...question } = dto;
        return this.prisma.$transaction(async (transaction) => {
            const existingQuestion = await transaction.feedbackQuestion.findUnique({
                where: { id },
            });
            if (!existingQuestion) {
                throw new common_1.NotFoundException(`Feedback question ${id} was not found`);
            }
            if (options !== undefined) {
                await transaction.feedbackQuestionOption.deleteMany({
                    where: { questionId: id },
                });
            }
            return transaction.feedbackQuestion.update({
                where: { id },
                data: {
                    ...question,
                    options: options !== undefined
                        ? {
                            createMany: {
                                data: options,
                            },
                        }
                        : undefined,
                },
                include: {
                    options: {
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                },
            });
        });
    }
    async updateAgentQuestions(agentId, questions) {
        await this.prisma.$transaction(questions.map((question) => this.prisma.agentFeedbackQuestion.upsert({
            where: {
                agentId_questionId: {
                    agentId,
                    questionId: question.questionId,
                },
            },
            update: {
                active: question.active,
                required: question.required,
                sortOrder: question.sortOrder,
                printable: question.printable,
                printableSortOrder: question.printableSortOrder,
            },
            create: {
                agentId,
                questionId: question.questionId,
                active: question.active,
                required: question.required,
                sortOrder: question.sortOrder,
            },
        })));
        return this.findAgentDefaultFeedbackQuestions(agentId);
    }
    findAgentDefaultFeedbackQuestions(agentId) {
        return this.prisma.agentFeedbackQuestion.findMany({
            where: {
                agentId,
                active: true,
            },
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
        });
    }
};
exports.FeedbackQuestionsService = FeedbackQuestionsService;
exports.FeedbackQuestionsService = FeedbackQuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeedbackQuestionsService);
//# sourceMappingURL=feedback-questions.service.js.map