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
exports.OpenHousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
const node_crypto_1 = require("node:crypto");
const agents_service_1 = require("src/agents/agents.service");
let OpenHousesService = class OpenHousesService {
    prisma;
    agentsService;
    constructor(prisma, agentsService) {
        this.prisma = prisma;
        this.agentsService = agentsService;
    }
    async create(agentId, createOpenHouseDto) {
        const publicCode = await this.generateUniquePublicCode();
        const property = await this.prisma.property.findFirst({
            where: {
                id: createOpenHouseDto.propertyId,
                agentId,
            },
        });
        if (!property) {
            throw new common_1.BadRequestException('The selected property does not belong to this agent.');
        }
        let selectedQuestions;
        if (createOpenHouseDto.feedbackQuestions) {
            selectedQuestions = createOpenHouseDto.feedbackQuestions.map((question) => ({
                questionId: question.questionId,
                required: question.required,
                sortOrder: question.sortOrder,
                printable: question.printable,
                printableSortOrder: question.printableSortOrder ?? null,
            }));
        }
        else {
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
            throw new common_1.BadRequestException('The agent must have active feedback questions before creating an open house.');
        }
        return this.prisma.$transaction((transaction) => transaction.openHouse.create({
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
        }));
    }
    findAll() {
        return this.prisma.openHouse.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    findAllByAgentId(id) {
        return this.prisma.openHouse.findMany({
            orderBy: { startsAt: 'desc' },
            where: { agentId: id },
            include: { property: true },
        });
    }
    async findOpenHouseDetail(agentId, openhouseId) {
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
        const agent = await this.agentsService.findProfile(openHouse.agent.id);
        return {
            ...openHouse,
            agent,
        };
    }
    async update(agentId, openHouseId, updateOpenHouseDto) {
        const openHouse = await this.prisma.openHouse.findFirst({
            where: {
                id: openHouseId,
                agentId,
            },
        });
        if (!openHouse) {
            throw new common_1.BadRequestException('Open house not found for this agent.');
        }
        if (updateOpenHouseDto.propertyId) {
            const property = await this.prisma.property.findFirst({
                where: {
                    id: updateOpenHouseDto.propertyId,
                    agentId,
                },
            });
            if (!property) {
                throw new common_1.BadRequestException('The selected property does not belong to this agent.');
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
    async removeBulk(agentId, openHouseIds) {
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
            throw new common_1.BadRequestException('No open houses were deleted. They may have associated feedback submissions, which prevents deletion.');
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
    generatePublicCode() {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const bytes = (0, node_crypto_1.randomBytes)(8);
        return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
    }
    async generateUniquePublicCode() {
        let publicCode = this.generatePublicCode();
        while (await this.prisma.openHouse.findUnique({ where: { publicCode } })) {
            publicCode = this.generatePublicCode();
        }
        return publicCode;
    }
};
exports.OpenHousesService = OpenHousesService;
exports.OpenHousesService = OpenHousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agents_service_1.AgentsService])
], OpenHousesService);
//# sourceMappingURL=open-houses.service.js.map