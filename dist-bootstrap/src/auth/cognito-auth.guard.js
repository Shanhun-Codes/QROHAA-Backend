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
exports.CognitoAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const cognito_auth_service_1 = require("./cognito-auth.service");
let CognitoAuthGuard = class CognitoAuthGuard {
    cognitoAuthService;
    constructor(cognitoAuthService) {
        this.cognitoAuthService = cognitoAuthService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        if (!authorization) {
            throw new common_1.UnauthorizedException('Missing authorization header');
        }
        const [type, token] = authorization.split(' ');
        if (type !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const payload = await this.cognitoAuthService.verifyAccessToken(token);
        const cognitoSub = payload.sub;
        if (!cognitoSub) {
            throw new common_1.UnauthorizedException('Missing Cognito sub');
        }
        request['user'] = {
            cognitoSub,
        };
        return true;
    }
};
exports.CognitoAuthGuard = CognitoAuthGuard;
exports.CognitoAuthGuard = CognitoAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cognito_auth_service_1.CognitoAuthService])
], CognitoAuthGuard);
//# sourceMappingURL=cognito-auth.guard.js.map