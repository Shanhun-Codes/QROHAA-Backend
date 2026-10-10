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
exports.PlatformAdminController = void 0;
const common_1 = require("@nestjs/common");
const current_cognito_sub_decorator_1 = require("src/auth/current-cognito-sub.decorator");
const platform_admin_guard_1 = require("src/auth/platform-admin.guard");
const create_invitation_dto_1 = require("./dto/create-invitation.dto");
const grant_access_dto_1 = require("./dto/grant-access.dto");
const update_account_status_dto_1 = require("./dto/update-account-status.dto");
const platform_admin_service_1 = require("./platform-admin.service");
let PlatformAdminController = class PlatformAdminController {
    platformAdminService;
    constructor(platformAdminService) {
        this.platformAdminService = platformAdminService;
    }
    createInvitation(actorSub, dto) {
        return this.platformAdminService.createInvitation(actorSub, dto);
    }
    listInvitations(actorSub) {
        return this.platformAdminService.listInvitations(actorSub);
    }
    revokeInvitation(actorSub, invitationId) {
        return this.platformAdminService.revokeInvitation(actorSub, invitationId);
    }
    listUsers(actorSub) {
        return this.platformAdminService.listUsers(actorSub);
    }
    listAgencies(actorSub) {
        return this.platformAdminService.listAgencies(actorSub);
    }
    updateAccountStatus(actorSub, userId, dto) {
        return this.platformAdminService.updateAccountStatus(actorSub, userId, dto.status);
    }
    grantUserAccess(actorSub, userId, dto) {
        return this.platformAdminService.grantUserAccess(actorSub, userId, dto);
    }
    grantAgencyAccess(actorSub, agencyId, dto) {
        return this.platformAdminService.grantAgencyAccess(actorSub, agencyId, dto);
    }
    revokeAccess(actorSub, entitlementId) {
        return this.platformAdminService.revokeAccess(actorSub, entitlementId);
    }
    listAuditLogs(actorSub) {
        return this.platformAdminService.listAuditLogs(actorSub);
    }
};
exports.PlatformAdminController = PlatformAdminController;
__decorate([
    (0, common_1.Post)('invitations'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_invitation_dto_1.CreateInvitationDto]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)('invitations'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "listInvitations", null);
__decorate([
    (0, common_1.Patch)('invitations/:invitationId/revoke'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Param)('invitationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "revokeInvitation", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('agencies'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "listAgencies", null);
__decorate([
    (0, common_1.Patch)('users/:userId/status'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_account_status_dto_1.UpdateAccountStatusDto]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "updateAccountStatus", null);
__decorate([
    (0, common_1.Post)('users/:userId/access'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, grant_access_dto_1.GrantAccessDto]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "grantUserAccess", null);
__decorate([
    (0, common_1.Post)('agencies/:agencyId/access'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Param)('agencyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, grant_access_dto_1.GrantAccessDto]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "grantAgencyAccess", null);
__decorate([
    (0, common_1.Patch)('access/:entitlementId/revoke'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __param(1, (0, common_1.Param)('entitlementId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "revokeAccess", null);
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, current_cognito_sub_decorator_1.CurrentCognitoSub)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformAdminController.prototype, "listAuditLogs", null);
exports.PlatformAdminController = PlatformAdminController = __decorate([
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    (0, common_1.Controller)('platform-admin'),
    __metadata("design:paramtypes", [platform_admin_service_1.PlatformAdminService])
], PlatformAdminController);
//# sourceMappingURL=platform-admin.controller.js.map