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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
const enums_1 = require("generated/prisma/enums");
let LeadsService = class LeadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(agentId, createLeadDto) {
        return this.prisma.lead.create({
            data: {
                firstName: createLeadDto.firstName ?? null,
                lastName: createLeadDto.lastName ?? null,
                email: createLeadDto.email ?? null,
                phone: createLeadDto.phone ?? null,
                agentId,
            },
            include: this.leadRelations(),
        });
    }
    findAll() {
        return this.prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            include: this.leadRelations(),
        });
    }
    findLeadDetail(agentId, leadId) {
        const selectedFeedbackKeys = [
            'budget_range',
            'pre_qualified',
            'purchase_timeline',
            'neighborhoods',
            'liked_least',
            'liked_most',
        ];
        return this.prisma.lead.findUnique({
            where: { agentId: agentId, id: leadId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                submissions: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        openHouseId: true,
                        createdAt: true,
                        feedbackAnswers: {
                            where: { question: { key: { in: selectedFeedbackKeys } } },
                            select: {
                                value: true,
                                question: {
                                    select: {
                                        key: true,
                                        label: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async findAllAgentLeads(agentId) {
        const newLeads = await this.prisma.lead.findMany({
            where: {
                agentId,
                status: enums_1.LeadStatusType.NEW,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const otherLeads = await this.prisma.lead.findMany({
            where: {
                agentId,
                status: {
                    notIn: [enums_1.LeadStatusType.NEW, enums_1.LeadStatusType.LOST],
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return [...newLeads, ...otherLeads];
    }
    async update(agentId, id, updateLeadDto) {
        const lead = await this.prisma.lead.findFirst({
            where: { id, agentId },
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead ${id} was not found.`);
        }
        return this.prisma.lead.update({
            where: { id, agentId },
            data: updateLeadDto,
            include: this.leadRelations(),
        });
    }
    async updateLeadStatusFromMultiSelect(agentId, leadIds, status) {
        const uniqueLeadIds = [...new Set(leadIds)];
        if (!uniqueLeadIds.length) {
            return this.findAllAgentLeads(agentId);
        }
        await this.prisma.$transaction(async (tx) => {
            const ownedLeads = await tx.lead.findMany({
                where: {
                    agentId,
                    id: {
                        in: uniqueLeadIds,
                    },
                },
                select: { id: true },
            });
            if (ownedLeads.length !== uniqueLeadIds.length) {
                throw new common_1.NotFoundException('One or more leads were not found.');
            }
            await tx.lead.updateMany({
                where: {
                    agentId,
                    id: { in: uniqueLeadIds },
                },
                data: {
                    updatedAt: new Date(),
                    status,
                },
            });
            await tx.note.createMany({
                data: ownedLeads.map(({ id: leadId }) => ({
                    agentId,
                    subjectType: enums_1.NoteEntityType.LEAD,
                    subjectId: leadId,
                    body: `Status updated to ${status}`,
                })),
            });
        });
        const leads = await this.findAllAgentLeads(agentId);
        return leads;
    }
    leadRelations() {
        return {
            submissions: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    openHouseId: true,
                    createdAt: true,
                },
            },
        };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map