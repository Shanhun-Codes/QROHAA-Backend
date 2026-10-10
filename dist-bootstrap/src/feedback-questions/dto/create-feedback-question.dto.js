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
exports.CreateFeedbackQuestionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const enums_1 = require("generated/prisma/enums");
class FeedbackQuestionOptionDto {
    label;
    value;
    sortOrder;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeedbackQuestionOptionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeedbackQuestionOptionDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], FeedbackQuestionOptionDto.prototype, "sortOrder", void 0);
class CreateFeedbackQuestionDto {
    key;
    label;
    type;
    category;
    active;
    options;
}
exports.CreateFeedbackQuestionDto = CreateFeedbackQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackQuestionDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackQuestionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.FeedbackQuestionType),
    __metadata("design:type", String)
], CreateFeedbackQuestionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.FeedbackQuestionCategory),
    __metadata("design:type", String)
], CreateFeedbackQuestionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeedbackQuestionDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FeedbackQuestionOptionDto),
    __metadata("design:type", Array)
], CreateFeedbackQuestionDto.prototype, "options", void 0);
//# sourceMappingURL=create-feedback-question.dto.js.map