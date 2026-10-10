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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
const storage_service_1 = require("src/storage/storage.service");
let AgentsService = class AgentsService {
    prisma;
    storageService;
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async create(createAgentDto) {
        const { brokerage } = createAgentDto;
        const slug = await this.generateUniqueSlug(createAgentDto.firstName, createAgentDto.lastName);
        const defaultQuestions = await this.prisma.feedbackQuestion.findMany({
            where: { active: true },
            select: { id: true },
            orderBy: { key: 'asc' },
        });
        const agent = await this.prisma.$transaction((transaction) => transaction.agent.create({
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
        }));
        const profile = await this.findProfile(agent.id);
        if (!profile) {
            throw new common_1.NotFoundException('Agent not found.');
        }
        return profile;
    }
    async findProfile(id) {
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
    async findOne(id) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
            include: { brokerage: true },
        });
        if (!agent) {
            return null;
        }
        return this.withAssetUrls(agent);
    }
    async getFeedbackQuestions(agentId) {
        await this.ensureAgentExists(agentId);
        return this.prisma.agentFeedbackQuestion.findMany({
            where: { agentId, question: { active: true } },
            orderBy: { sortOrder: 'asc' },
            include: {
                question: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
            },
        });
    }
    async replaceFeedbackQuestions(agentId, selections) {
        await this.ensureAgentExists(agentId);
        const questionIds = selections.map((selection) => selection.questionId);
        const sortOrders = selections.map((selection) => selection.sortOrder);
        if (new Set(questionIds).size !== questionIds.length) {
            throw new common_1.BadRequestException('Each feedback question may only be selected once.');
        }
        if (new Set(sortOrders).size !== sortOrders.length ||
            sortOrders.some((sortOrder) => sortOrder < 0)) {
            throw new common_1.BadRequestException('Sort orders must be unique non-negative integers.');
        }
        const activeQuestionCount = await this.prisma.feedbackQuestion.count({
            where: { id: { in: questionIds }, active: true },
        });
        if (activeQuestionCount !== questionIds.length) {
            throw new common_1.BadRequestException('Every selected feedback question must exist and be active.');
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
    async update(id, updateAgentDto) {
        await this.ensureAgentExists(id);
        const { primaryColor, secondaryColor, accentColor, brokerage, ...agentData } = updateAgentDto;
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
    remove(id) {
        return `This action removes a #${id} agent`;
    }
    async buildBrokerageUpdate(agentId, brokerage) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            select: { brandingLocked: true, brokerage: { select: { id: true } } },
        });
        if (agent?.brandingLocked) {
            throw new common_1.ForbiddenException('Brokerage is managed by your agency.');
        }
        const { address, ...fields } = brokerage;
        const data = { ...fields, ...address };
        if (agent?.brokerage) {
            return { update: data };
        }
        if (!brokerage.name) {
            throw new common_1.BadRequestException('Brokerage name is required.');
        }
        return { create: { ...data, name: brokerage.name } };
    }
    generateSlug(firstName, lastName) {
        return `${firstName} ${lastName}`
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async generateUniqueSlug(firstName, lastName) {
        const baseSlug = this.generateSlug(firstName, lastName);
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.agent.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter += 1;
        }
        return slug;
    }
    async ensureAgentExists(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
        });
        if (!agent)
            throw new common_1.NotFoundException(`Agent ${agentId} was not found.`);
    }
    normalizeHexColor(color) {
        if (!color)
            return null;
        return color.startsWith('#') ? color : `#${color}`;
    }
    async completeAssetUpload(agentId, type, key) {
        if (!this.storageService.validateAgentAssetKey(agentId, type, key)) {
            throw new common_1.BadRequestException('Invalid asset key.');
        }
        const agent = await this.prisma.agent.findUnique({
            where: {
                id: agentId,
            },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found.');
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
    async withAssetUrls(agent) {
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
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], AgentsService);
//# sourceMappingURL=agents.service.js.map