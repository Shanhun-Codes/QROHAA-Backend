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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const redeem_invitation_dto_1 = require("./dto/redeem-invitation.dto");
const auth_user_service_1 = require("src/auth/auth-user.service");
const cognito_auth_guard_1 = require("src/auth/cognito-auth.guard");
const onboarding_service_1 = require("./onboarding.service");
let OnboardingController = class OnboardingController {
    authUserService;
    onboardingService;
    constructor(authUserService, onboardingService) {
        this.authUserService = authUserService;
        this.onboardingService = onboardingService;
    }
    async getMe(request) {
        const cognitoSub = request['user']?.cognitoSub;
        if (!cognitoSub) {
            throw new common_1.UnauthorizedException('Missing Cognito sub');
        }
        const user = await this.authUserService.getUserByCognitoSub(cognitoSub);
        if (!user) {
            return {
                hasAgent: false,
                invitationRequired: true,
            };
        }
        if (!user.accessGranted) {
            return {
                hasAgent: false,
                accessGranted: false,
                accessStatus: user.accessStatus,
            };
        }
        return {
            hasAgent: true,
            accessGranted: true,
            agent: user.agent,
        };
    }
    async redeemInvitation(request, idToken, redeemInvitationDto) {
        const cognitoSub = request['user']?.cognitoSub;
        if (!cognitoSub) {
            throw new common_1.UnauthorizedException('Missing Cognito sub');
        }
        if (!idToken) {
            throw new common_1.UnauthorizedException('Missing Cognito ID token');
        }
        return this.onboardingService.redeemInvitation(cognitoSub, idToken, redeemInvitationDto);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('agent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-cognito-id-token')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, redeem_invitation_dto_1.RedeemInvitationDto]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "redeemInvitation", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.UseGuards)(cognito_auth_guard_1.CognitoAuthGuard),
    (0, common_1.Controller)('onboarding'),
    __metadata("design:paramtypes", [auth_user_service_1.AuthUserService,
        onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map