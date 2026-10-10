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
exports.AuthUserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const agents_service_1 = require("src/agents/agents.service");
let AuthUserService = class AuthUserService {
    prisma;
    agentsService;
    constructor(prisma, agentsService) {
        this.prisma = prisma;
        this.agentsService = agentsService;
    }
    async getApplicationUser(cognitoSub) {
        const user = await this.prisma.user.findUnique({
            where: { cognitoSub },
            include: {
                agent: true,
                entitlements: true,
                agency: { include: { entitlements: true } },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Authenticated user is not registered');
        }
        if (String(user.status) !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Account is not active.');
        }
        if (String(user.role) !== 'PLATFORM_ADMIN' && !this.hasEntitlement(user)) {
            throw new common_1.ForbiddenException('An active access entitlement is required.');
        }
        return user;
    }
    async getAgentByCognitoSub(cognitoSub) {
        const user = await this.getApplicationUser(cognitoSub);
        if (String(user.role) !== 'AGENT' || !user.agent) {
            throw new common_1.ForbiddenException('Agent access is required.');
        }
        return user.agent;
    }
    async requirePlatformAdmin(cognitoSub) {
        const user = await this.prisma.user.findUnique({
            where: { cognitoSub },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Authenticated user is not registered');
        }
        if (String(user.status) !== 'ACTIVE' ||
            String(user.role) !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Platform administrator access is required.');
        }
        return user;
    }
    async requireAgencyAdmin(cognitoSub) {
        const user = await this.getApplicationUser(cognitoSub);
        if (String(user.role) !== 'AGENCY_ADMIN' || !user.agencyId) {
            throw new common_1.ForbiddenException('Agency administrator access is required.');
        }
        return user;
    }
    async assertAgencyOwnsAgent(agencyId, agentId) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, agencyId },
            select: { id: true },
        });
        if (!agent) {
            throw new common_1.ForbiddenException('Agent is outside this agency.');
        }
        return agent;
    }
    async getUserByCognitoSub(cognitoSub) {
        const user = await this.prisma.user.findUnique({
            where: { cognitoSub },
            include: {
                agent: true,
                entitlements: true,
                agency: { include: { entitlements: true } },
            },
        });
        if (!user) {
            return null;
        }
        const accessGranted = String(user.status) === 'ACTIVE' &&
            (String(user.role) === 'PLATFORM_ADMIN' || this.hasEntitlement(user));
        if (!accessGranted || String(user.role) !== 'AGENT' || !user.agent) {
            return {
                accessGranted: false,
                accessStatus: String(user.status) !== 'ACTIVE'
                    ? String(user.status)
                    : String(user.role) !== 'AGENT'
                        ? 'ROLE_UNSUPPORTED'
                        : 'NO_ENTITLEMENT',
            };
        }
        const agent = await this.agentsService.findProfile(user.agent.id);
        return { accessGranted: true, agent };
    }
    hasEntitlement(user) {
        const now = new Date();
        const entitlements = [
            ...user.entitlements,
            ...(user.agency?.entitlements ?? []),
        ];
        return entitlements.some((entitlement) => entitlement.status === 'ACTIVE' &&
            entitlement.revokedAt === null &&
            entitlement.startsAt <= now &&
            (entitlement.expiresAt === null || entitlement.expiresAt > now));
    }
};
exports.AuthUserService = AuthUserService;
exports.AuthUserService = AuthUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agents_service_1.AgentsService])
], AuthUserService);
//# sourceMappingURL=auth-user.service.js.map