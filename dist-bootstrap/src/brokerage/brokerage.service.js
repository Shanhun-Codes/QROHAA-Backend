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
exports.BrokerageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
let BrokerageService = class BrokerageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findForAgent(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            select: { agencyId: true, brandingLocked: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        if (agent.agencyId && agent.brandingLocked) {
            return this.prisma.brokerage.findUnique({
                where: { agencyId: agent.agencyId },
            });
        }
        return this.prisma.brokerage.findUnique({ where: { agentId } });
    }
    async create(agentId, dto) {
        await this.assertEditable(agentId);
        return this.prisma.brokerage.upsert({
            where: { agentId },
            create: { ...dto, agentId },
            update: dto,
        });
    }
    async update(agentId, dto) {
        await this.assertEditable(agentId);
        const existing = await this.prisma.brokerage.findUnique({
            where: { agentId },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Brokerage not found');
        }
        return this.prisma.brokerage.update({
            where: { agentId },
            data: dto,
        });
    }
    async assertEditable(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            select: { brandingLocked: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        if (agent.brandingLocked) {
            throw new common_1.ForbiddenException('Brokerage is managed by your agency');
        }
    }
};
exports.BrokerageService = BrokerageService;
exports.BrokerageService = BrokerageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrokerageService);
//# sourceMappingURL=brokerage.service.js.map