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
exports.PlatformAdminService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("src/prisma/prisma.service");
let PlatformAdminService = class PlatformAdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInvitation(actorSub, dto) {
        const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
        const expiresAt = new Date(Date.now() + (dto.expiresInHours ?? 72) * 60 * 60 * 1000);
        const accountType = dto.accountType;
        const role = accountType === 'AGENT' ? 'AGENT' : 'AGENCY_ADMIN';
        const normalizedEmail = this.normalizeEmail(dto.email);
        const invitation = await this.prisma.$transaction(async (transaction) => {
            const created = await transaction.invitation.create({
                data: {
                    email: normalizedEmail,
                    tokenHash: this.hashToken(token),
                    role,
                    accountType,
                    createdBySub: actorSub,
                    expiresAt,
                },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'INVITATION_CREATED',
                    targetType: 'Invitation',
                    targetId: created.id,
                    metadata: { accountType },
                },
            });
            return created;
        });
        return {
            id: invitation.id,
            email: invitation.email,
            accountType: invitation.accountType,
            expiresAt: invitation.expiresAt,
            token,
        };
    }
    async revokeInvitation(actorSub, invitationId) {
        return this.prisma.$transaction(async (transaction) => {
            const changed = await transaction.invitation.updateMany({
                where: {
                    id: invitationId,
                    revokedAt: null,
                    redeemedAt: null,
                },
                data: { revokedAt: new Date() },
            });
            if (changed.count !== 1) {
                throw new common_1.NotFoundException('Invitation not found or unavailable.');
            }
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'INVITATION_REVOKED',
                    targetType: 'Invitation',
                    targetId: invitationId,
                },
            });
            return { revoked: true };
        });
    }
    async listInvitations(actorSub) {
        return this.prisma.$transaction(async (transaction) => {
            const invitations = await transaction.invitation.findMany({
                select: {
                    id: true,
                    email: true,
                    accountType: true,
                    role: true,
                    agencyId: true,
                    createdBySub: true,
                    expiresAt: true,
                    revokedAt: true,
                    redeemedAt: true,
                    redeemedBySub: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 500,
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ADMIN_INVITATIONS_LISTED',
                    targetType: 'InvitationList',
                    targetId: 'recent',
                    metadata: { resultCount: invitations.length },
                },
            });
            return invitations;
        });
    }
    async listUsers(actorSub) {
        return this.prisma.$transaction(async (transaction) => {
            await this.expireDueAccess(transaction);
            const users = await transaction.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    agentId: true,
                    agencyId: true,
                    createdAt: true,
                    entitlements: {
                        select: {
                            id: true,
                            type: true,
                            status: true,
                            startsAt: true,
                            expiresAt: true,
                            revokedAt: true,
                        },
                    },
                    agency: {
                        select: {
                            id: true,
                            name: true,
                            entitlements: {
                                select: {
                                    id: true,
                                    type: true,
                                    status: true,
                                    startsAt: true,
                                    expiresAt: true,
                                    revokedAt: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ADMIN_USERS_LISTED',
                    targetType: 'UserList',
                    targetId: 'all',
                    metadata: { resultCount: users.length },
                },
            });
            return users;
        });
    }
    async listAgencies(actorSub) {
        return this.prisma.$transaction(async (transaction) => {
            await this.expireDueAccess(transaction);
            const agencies = await transaction.agency.findMany({
                select: {
                    id: true,
                    name: true,
                    seatLimit: true,
                    createdAt: true,
                    _count: { select: { agents: true, users: true } },
                    entitlements: {
                        select: {
                            id: true,
                            type: true,
                            status: true,
                            startsAt: true,
                            expiresAt: true,
                            revokedAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ADMIN_AGENCIES_LISTED',
                    targetType: 'AgencyList',
                    targetId: 'all',
                    metadata: { resultCount: agencies.length },
                },
            });
            return agencies;
        });
    }
    async updateAccountStatus(actorSub, userId, status) {
        return this.prisma.$transaction(async (transaction) => {
            const user = await transaction.user.findUnique({
                where: { id: userId },
                select: { id: true, status: true },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found.');
            const updated = await transaction.user.update({
                where: { id: userId },
                data: { status },
                select: { id: true, status: true },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED',
                    targetType: 'User',
                    targetId: userId,
                    metadata: { previousStatus: user.status, status },
                },
            });
            return updated;
        });
    }
    grantUserAccess(actorSub, userId, dto) {
        return this.grantAccess(actorSub, 'userId', userId, dto);
    }
    grantAgencyAccess(actorSub, agencyId, dto) {
        return this.grantAccess(actorSub, 'agencyId', agencyId, dto);
    }
    async grantAccess(actorSub, targetField, targetId, dto) {
        const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (expiresAt && expiresAt <= startsAt) {
            throw new common_1.BadRequestException('Access expiration must follow its start.');
        }
        return this.prisma.$transaction(async (transaction) => {
            const targetExists = targetField === 'userId'
                ? await transaction.user.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                })
                : await transaction.agency.findUnique({
                    where: { id: targetId },
                    select: { id: true },
                });
            if (!targetExists)
                throw new common_1.NotFoundException('Access target not found.');
            const entitlement = await transaction.accessEntitlement.create({
                data: {
                    type: dto.type,
                    status: 'ACTIVE',
                    startsAt,
                    expiresAt,
                    grantedBySub: actorSub,
                    [targetField]: targetId,
                },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ACCESS_GRANTED',
                    targetType: targetField === 'userId' ? 'User' : 'Agency',
                    targetId,
                    metadata: {
                        entitlementId: entitlement.id,
                        type: dto.type,
                        expiresAt,
                    },
                },
            });
            return entitlement;
        });
    }
    async revokeAccess(actorSub, entitlementId) {
        return this.prisma.$transaction(async (transaction) => {
            const entitlement = await transaction.accessEntitlement.findUnique({
                where: { id: entitlementId },
                select: { id: true, userId: true, agencyId: true, status: true },
            });
            if (!entitlement || entitlement.status !== 'ACTIVE') {
                throw new common_1.NotFoundException('Active entitlement not found.');
            }
            const revokedAt = new Date();
            await transaction.accessEntitlement.update({
                where: { id: entitlementId },
                data: { status: 'REVOKED', revokedAt },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ACCESS_REVOKED',
                    targetType: entitlement.userId ? 'User' : 'Agency',
                    targetId: entitlement.userId ?? entitlement.agencyId,
                    metadata: { entitlementId },
                },
            });
            return { revoked: true };
        });
    }
    async listAuditLogs(actorSub) {
        return this.prisma.$transaction(async (transaction) => {
            const logs = await transaction.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 500,
            });
            await transaction.auditLog.create({
                data: {
                    actorSub,
                    action: 'ADMIN_AUDIT_LOGS_LISTED',
                    targetType: 'AuditLogList',
                    targetId: 'recent',
                    metadata: { resultCount: logs.length },
                },
            });
            return logs;
        });
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    expireDueAccess(transaction) {
        return transaction.accessEntitlement.updateMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lte: new Date() },
            },
            data: { status: 'EXPIRED' },
        });
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.PlatformAdminService = PlatformAdminService;
exports.PlatformAdminService = PlatformAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformAdminService);
//# sourceMappingURL=platform-admin.service.js.map