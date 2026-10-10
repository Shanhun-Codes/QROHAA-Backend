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
exports.CreateOnboardingAgentDto = exports.UpdateBrokerageSetupDto = exports.UpdateBrokerageAddressDto = exports.BrokerageSetupDto = exports.BrokerageAddressDto = void 0;
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
const create_agent_dto_1 = require("src/agents/dto/create-agent.dto");
class BrokerageAddressDto {
    street;
    street2;
    city;
    state;
    zip;
}
exports.BrokerageAddressDto = BrokerageAddressDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageAddressDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BrokerageAddressDto.prototype, "street2", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageAddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageAddressDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageAddressDto.prototype, "zip", void 0);
class BrokerageSetupDto {
    name;
    licenseNumber;
    address;
    phone;
    email;
    websiteUrl;
}
exports.BrokerageSetupDto = BrokerageSetupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageSetupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BrokerageSetupDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BrokerageAddressDto),
    __metadata("design:type", BrokerageAddressDto)
], BrokerageSetupDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BrokerageSetupDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], BrokerageSetupDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], BrokerageSetupDto.prototype, "websiteUrl", void 0);
class UpdateBrokerageAddressDto extends (0, mapped_types_1.PartialType)(BrokerageAddressDto) {
}
exports.UpdateBrokerageAddressDto = UpdateBrokerageAddressDto;
class UpdateBrokerageSetupDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(BrokerageSetupDto, ['address'])) {
    address;
}
exports.UpdateBrokerageSetupDto = UpdateBrokerageSetupDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UpdateBrokerageAddressDto),
    __metadata("design:type", UpdateBrokerageAddressDto)
], UpdateBrokerageSetupDto.prototype, "address", void 0);
class CreateOnboardingAgentDto extends create_agent_dto_1.CreateAgentDto {
    realEstateLicenseNumber;
    brokerage;
}
exports.CreateOnboardingAgentDto = CreateOnboardingAgentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOnboardingAgentDto.prototype, "realEstateLicenseNumber", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BrokerageSetupDto),
    __metadata("design:type", BrokerageSetupDto)
], CreateOnboardingAgentDto.prototype, "brokerage", void 0);
//# sourceMappingURL=create-onboarding-agent.dto.js.map