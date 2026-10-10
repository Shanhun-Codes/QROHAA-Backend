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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const public_service_1 = require("./public.service");
const submit_public_feedback_dto_1 = require("./dto/submit-public-feedback.dto");
let PublicController = class PublicController {
    publicService;
    constructor(publicService) {
        this.publicService = publicService;
    }
    findAgent(slug) {
        return this.publicService.findPublicAgentBySlug(slug);
    }
    findOpenHouseByPublicCode(publicCode) {
        return this.publicService.findOpenHouseByPublicCode(publicCode);
    }
    getConfigurationData(slug, publicCode) {
        return this.publicService.getConfigurationData(slug, publicCode);
    }
    submitFeedback(slug, publicCode, submitFeedbackDto, request) {
        const browserToken = request.header('x-submission-browser-token');
        return this.publicService.submitFeedback(slug, publicCode, submitFeedbackDto, request.ip ?? 'unknown', browserToken);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('agents/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "findAgent", null);
__decorate([
    (0, common_1.Get)('agents/:slug/open-houses/:publicCode'),
    __param(0, (0, common_1.Param)('publicCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "findOpenHouseByPublicCode", null);
__decorate([
    (0, common_1.Get)('/agents/:slug/open-houses/:publicCode/configuration'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('publicCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "getConfigurationData", null);
__decorate([
    (0, common_1.Post)('agents/:slug/open-houses/:publicCode/feedback'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('publicCode')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, submit_public_feedback_dto_1.SubmitPublicFeedbackDto, Object]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "submitFeedback", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map