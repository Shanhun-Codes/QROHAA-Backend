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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const agents_service_1 = require("src/agents/agents.service");
const cognito_auth_service_1 = require("src/auth/cognito-auth.service");
const prisma_service_1 = require("src/prisma/prisma.service");
let OnboardingService = class OnboardingService {
    prisma;
    agentsService;
    cognitoAuthService;
    constructor(prisma, agentsService, cognitoAuthService) {
        this.prisma = prisma;
        this.agentsService = agentsService;
        this.cognitoAuthService = cognitoAuthService;
    }
    async redeemInvitation(cognitoSub, idToken, dto) {
        const identity = await this.cognitoAuthService.verifyInvitationIdentity(idToken, cognitoSub);
        const tokenHash = this.hashInvitationToken(dto.invitationToken);
        const invitation = await this.prisma.invitation.findUnique({
            where: { tokenHash },
        });
        const now = new Date();
        if (!invitation ||
            invitation.revokedAt ||
            invitation.redeemedAt ||
            invitation.expiresAt <= now ||
            this.cognitoAuthService.normalizeEmail(invitation.email) !==
                identity.email) {
            throw new common_1.BadRequestException('Invitation is invalid or unavailable.');
        }
        if (invitation.accountType === 'AGENT') {
            this.validateAgentDetails(dto);
        }
        else if (!dto.agency?.name?.trim()) {
            throw new common_1.BadRequestException('Agency name is required.');
        }
        const defaultQuestions = invitation.accountType === 'AGENT'
            ? await this.prisma.feedbackQuestion.findMany({
                where: { active: true },
                select: { id: true },
                orderBy: { key: 'asc' },
            })
            : [];
        const provisioned = await this.prisma.$transaction(async (transaction) => {
            const claimed = await transaction.invitation.updateMany({
                where: {
                    id: invitation.id,
                    revokedAt: null,
                    redeemedAt: null,
                    expiresAt: { gt: now },
                },
                data: {
                    redeemedAt: now,
                    redeemedBySub: identity.sub,
                },
            });
            if (claimed.count !== 1) {
                throw new common_1.BadRequestException('Invitation is invalid or unavailable.');
            }
            if (await transaction.user.findFirst({
                where: {
                    OR: [{ cognitoSub: identity.sub }, { email: identity.email }],
                },
                select: { id: true },
            })) {
                throw new common_1.BadRequestException('This account is already provisioned.');
            }
            let agentId;
            let agencyId;
            if (invitation.accountType === 'AGENT') {
                const slug = await this.agentsService.generateUniqueSlug(dto.firstName.trim(), dto.lastName.trim());
                const agent = await transaction.agent.create({
                    data: {
                        slug,
                        firstName: dto.firstName.trim(),
                        lastName: dto.lastName.trim(),
                        email: identity.email,
                        phone: dto.phone.trim(),
                        realEstateLicenseNumber: dto.realEstateLicenseNumber.trim(),
                        headline: dto.headline?.trim() || null,
                        logoUrl: dto.logoUrl?.trim() || null,
                        headshotUrl: dto.headshotUrl?.trim() || null,
                        primaryColor: this.normalizeColor(dto.primaryColor),
                        secondaryColor: this.normalizeColor(dto.secondaryColor),
                        accentColor: this.normalizeColor(dto.accentColor),
                        agentFeedbackQuestions: {
                            create: defaultQuestions.map((question, sortOrder) => ({
                                questionId: question.id,
                                sortOrder,
                            })),
                        },
                        brokerage: {
                            create: {
                                name: dto.brokerage.name.trim(),
                                licenseNumber: dto.brokerage.licenseNumber.trim(),
                                phone: dto.brokerage.phone?.trim() || null,
                                email: dto.brokerage.email?.trim().toLowerCase() || null,
                                websiteUrl: dto.brokerage.websiteUrl?.trim() || null,
                                street: dto.brokerage.address.street.trim(),
                                street2: dto.brokerage.address.street2?.trim() || null,
                                city: dto.brokerage.address.city.trim(),
                                state: dto.brokerage.address.state.trim(),
                                zip: dto.brokerage.address.zip.trim(),
                            },
                        },
                    },
                    select: { id: true },
                });
                agentId = agent.id;
            }
            else {
                const agency = await transaction.agency.create({
                    data: {
                        name: dto.agency.name.trim(),
                        headline: dto.agency.headline?.trim() || null,
                        logoUrl: dto.agency.logoUrl?.trim() || null,
                        primaryColor: this.normalizeColor(dto.agency.primaryColor),
                        secondaryColor: this.normalizeColor(dto.agency.secondaryColor),
                        accentColor: this.normalizeColor(dto.agency.accentColor),
                    },
                    select: { id: true },
                });
                agencyId = agency.id;
            }
            await transaction.user.create({
                data: {
                    cognitoSub: identity.sub,
                    email: identity.email,
                    role: invitation.role,
                    status: 'ACTIVE',
                    ...(agentId && { agentId }),
                    ...(agencyId && { agencyId }),
                },
            });
            await transaction.auditLog.create({
                data: {
                    actorSub: identity.sub,
                    action: 'INVITATION_REDEEMED',
                    targetType: 'Invitation',
                    targetId: invitation.id,
                    metadata: { accountType: invitation.accountType },
                },
            });
            return { agentId, agencyId };
        });
        if (provisioned.agentId) {
            const agent = await this.agentsService.findProfile(provisioned.agentId);
            if (!agent) {
                throw new common_1.UnauthorizedException('Unable to load provisioned profile.');
            }
            return agent;
        }
        return {
            hasAgent: false,
            agencyId: provisioned.agencyId,
            accessPending: true,
        };
    }
    validateAgentDetails(dto) {
        const requiredValues = [
            dto.firstName,
            dto.lastName,
            dto.phone,
            dto.realEstateLicenseNumber,
            dto.brokerage?.name,
            dto.brokerage?.licenseNumber,
            dto.brokerage?.address?.street,
            dto.brokerage?.address?.city,
            dto.brokerage?.address?.state,
            dto.brokerage?.address?.zip,
        ];
        if (requiredValues.some((value) => !value?.trim())) {
            throw new common_1.BadRequestException('Required agent or brokerage details are missing.');
        }
    }
    hashInvitationToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    normalizeColor(color) {
        if (!color?.trim())
            return null;
        return color.startsWith('#') ? color : `#${color}`;
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agents_service_1.AgentsService,
        cognito_auth_service_1.CognitoAuthService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map