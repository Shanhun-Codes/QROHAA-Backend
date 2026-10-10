"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const cognito_auth_guard_1 = require("./cognito-auth.guard");
const cognito_auth_service_1 = require("./cognito-auth.service");
const auth_user_service_1 = require("./auth-user.service");
const agent_auth_guard_1 = require("./agent-auth.guard");
const platform_admin_guard_1 = require("./platform-admin.guard");
const agency_admin_guard_1 = require("./agency-admin.guard");
const agents_module_1 = require("src/agents/agents.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [agents_module_1.AgentsModule],
        providers: [
            cognito_auth_service_1.CognitoAuthService,
            cognito_auth_guard_1.CognitoAuthGuard,
            auth_user_service_1.AuthUserService,
            agent_auth_guard_1.AgentAuthGuard,
            platform_admin_guard_1.PlatformAdminGuard,
            agency_admin_guard_1.AgencyAdminGuard,
        ],
        exports: [
            cognito_auth_service_1.CognitoAuthService,
            cognito_auth_guard_1.CognitoAuthGuard,
            auth_user_service_1.AuthUserService,
            agent_auth_guard_1.AgentAuthGuard,
            platform_admin_guard_1.PlatformAdminGuard,
            agency_admin_guard_1.AgencyAdminGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map