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
exports.RedeemInvitationDto = exports.AgencyInvitationSetupDto = void 0;
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
const create_onboarding_agent_dto_1 = require("./create-onboarding-agent.dto");
class AgencyInvitationSetupDto {
    name;
    headline;
    logoUrl;
    primaryColor;
    secondaryColor;
    accentColor;
}
exports.AgencyInvitationSetupDto = AgencyInvitationSetupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "headline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "primaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "secondaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgencyInvitationSetupDto.prototype, "accentColor", void 0);
class RedeemInvitationDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_onboarding_agent_dto_1.CreateOnboardingAgentDto, ['email'])) {
    invitationToken;
    agency;
}
exports.RedeemInvitationDto = RedeemInvitationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RedeemInvitationDto.prototype, "invitationToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AgencyInvitationSetupDto),
    __metadata("design:type", AgencyInvitationSetupDto)
], RedeemInvitationDto.prototype, "agency", void 0);
//# sourceMappingURL=redeem-invitation.dto.js.map