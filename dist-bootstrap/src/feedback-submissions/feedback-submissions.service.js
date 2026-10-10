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
exports.FeedbackSubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
let FeedbackSubmissionsService = class FeedbackSubmissionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createFeedbackSubmissionDto) {
        return this.prisma.feedbackSubmission.create({
            data: {
                openHouseId: createFeedbackSubmissionDto.openHouseId,
                feedbackAnswers: {
                    create: createFeedbackSubmissionDto.feedbackAnswers,
                },
            },
        });
    }
    async findAll() {
        const submissions = await this.prisma.feedbackSubmission.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                feedbackAnswers: {
                    include: {
                        question: true,
                    },
                },
            },
        });
        return submissions.map(({ feedbackAnswers, ...submission }) => ({
            ...submission,
            questions: feedbackAnswers.map((answer) => ({
                id: answer.question.id,
                key: answer.question.key,
                label: answer.question.label,
                type: answer.question.type,
                answer: answer.value,
            })),
        }));
    }
    async findOne(id) {
        const submission = await this.prisma.feedbackSubmission.findUnique({
            where: { id },
            include: {
                feedbackAnswers: {
                    include: { question: true },
                },
            },
        });
        if (!submission)
            return null;
        const { feedbackAnswers, ...submissionData } = submission;
        return {
            ...submissionData,
            questions: feedbackAnswers.map((answer) => ({
                id: answer.question.id,
                key: answer.question.key,
                label: answer.question.label,
                type: answer.question.type,
                answer: answer.value,
            })),
        };
    }
};
exports.FeedbackSubmissionsService = FeedbackSubmissionsService;
exports.FeedbackSubmissionsService = FeedbackSubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeedbackSubmissionsService);
//# sourceMappingURL=feedback-submissions.service.js.map