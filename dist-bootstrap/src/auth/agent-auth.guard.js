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
exports.AgentAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_user_service_1 = require("./auth-user.service");
const cognito_auth_guard_1 = require("./cognito-auth.guard");
let AgentAuthGuard = class AgentAuthGuard {
    cognitoAuthGuard;
    authUserService;
    constructor(cognitoAuthGuard, authUserService) {
        this.cognitoAuthGuard = cognitoAuthGuard;
        this.authUserService = authUserService;
    }
    async canActivate(context) {
        await this.cognitoAuthGuard.canActivate(context);
        const request = context.switchToHttp().getRequest();
        const cognitoSub = request['user']?.cognitoSub;
        if (!cognitoSub) {
            throw new common_1.UnauthorizedException('Missing Cognito sub');
        }
        const agent = await this.authUserService.getAgentByCognitoSub(cognitoSub);
        request['user'] = {
            ...request['user'],
            agentId: agent.id,
        };
        return true;
    }
};
exports.AgentAuthGuard = AgentAuthGuard;
exports.AgentAuthGuard = AgentAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cognito_auth_guard_1.CognitoAuthGuard,
        auth_user_service_1.AuthUserService])
], AgentAuthGuard);
//# sourceMappingURL=agent-auth.guard.js.map