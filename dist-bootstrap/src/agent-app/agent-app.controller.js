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
exports.AgentAppController = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("generated/prisma/enums");
const agents_service_1 = require("src/agents/agents.service");
const update_agent_dto_1 = require("src/agents/dto/update-agent.dto");
const agent_auth_guard_1 = require("src/auth/agent-auth.guard");
const current_agent_id_decorator_1 = require("src/auth/current-agent-id.decorator");
const feedback_questions_service_1 = require("src/feedback-questions/feedback-questions.service");
const create_lead_dto_1 = require("src/leads/dto/create-lead.dto");
const leads_service_1 = require("src/leads/leads.service");
const create_note_dto_1 = require("src/notes/dto/create-note.dto");
const update_note_dto_1 = require("src/notes/dto/update-note.dto");
const notes_service_1 = require("src/notes/notes.service");
const create_open_houses_dto_1 = require("src/open-houses/dto/create-open-houses.dto");
const update_open_houses_dto_1 = require("src/open-houses/dto/update-open-houses.dto");
const open_house_pdf_service_1 = require("src/open-houses/open-house-pdf.service");
const open_houses_service_1 = require("src/open-houses/open-houses.service");
const create_properties_dto_1 = require("src/properties/dto/create-properties.dto");
const properties_service_1 = require("src/properties/properties.service");
const create_agent_upload_url_dto_1 = require("src/storage/dto/create-agent-upload-url.dto");
const storage_service_1 = require("src/storage/storage.service");
const complete_agent_upload_dto_1 = require("src/storage/dto/complete-agent-upload.dto");
const update_properties_dto_1 = require("src/properties/dto/update-properties.dto");
let AgentAppController = class AgentAppController {
    leadsService;
    openHouseService;
    agentsService;
    propertyService;
    notesService;
    feedbackQuestionService;
    openHousePdfService;
    storageService;
    constructor(leadsService, openHouseService, agentsService, propertyService, notesService, feedbackQuestionService, openHousePdfService, storageService) {
        this.leadsService = leadsService;
        this.openHouseService = openHouseService;
        this.agentsService = agentsService;
        this.propertyService = propertyService;
        this.notesService = notesService;
        this.feedbackQuestionService = feedbackQuestionService;
        this.openHousePdfService = openHousePdfService;
        this.storageService = storageService;
    }
    updateAgent(agentId, updateAgentDto) {
        return this.agentsService.update(agentId, updateAgentDto);
    }
    createAgentAssetUploadUrl(agentId, dto) {
        return this.storageService.createAgentUploadUrl(agentId, dto.type, dto.contentType);
    }
    async completeAgentAssetUpload(agentId, dto) {
        return this.agentsService.completeAssetUpload(agentId, dto.type, dto.key);
    }
    findAllAgentLeads(agentId) {
        return this.leadsService.findAllAgentLeads(agentId);
    }
    findLeadDetail(agentId, leadId) {
        return this.leadsService.findLeadDetail(agentId, leadId);
    }
    createLeadFromAgentApp(agentId, createLeadDto) {
        return this.leadsService.create(agentId, createLeadDto);
    }
    updateLeadStatusFromMultiSelect(agentId, leadIds, status) {
        return this.leadsService.updateLeadStatusFromMultiSelect(agentId, leadIds, status);
    }
    getLeadNotes(agentId, leadId) {
        return this.notesService.findAllBySubject(agentId, enums_1.NoteEntityType.LEAD, leadId);
    }
    createLeadNote(agentId, leadId, createNoteDto) {
        return this.notesService.create(agentId, enums_1.NoteEntityType.LEAD, leadId, createNoteDto);
    }
    editNote(agentId, leadId, noteId, updateNoteDto) {
        return this.notesService.editNote(agentId, leadId, noteId, updateNoteDto);
    }
    getAllAgentProperties(agentId) {
        return this.propertyService.findAllAgentProperties(agentId);
    }
    createProperty(agentId, createPropertyDto) {
        return this.propertyService.create(agentId, createPropertyDto);
    }
    updateProperty(agentId, propertyId, updatePropertyDto) {
        return this.propertyService.update(agentId, propertyId, updatePropertyDto);
    }
    createPropertyNote(agentId, propertyId, createNoteDto) {
        return this.notesService.create(agentId, enums_1.NoteEntityType.PROPERTY, propertyId, createNoteDto);
    }
    getAllAgentOpenHouses(agentId) {
        return this.openHouseService.findAllByAgentId(agentId);
    }
    async downloadOpenHouseFeedbackForm(agentId, openHouseId, response) {
        const pdf = await this.openHousePdfService.generateFeedbackForm(agentId, openHouseId);
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="open-house-feedback-form.pdf"`,
            'Content-Length': pdf.length,
        });
        response.end(pdf);
    }
    async downloadOpenHouseFlyer(agentId, openHouseId, response) {
        const pdf = await this.openHousePdfService.generateFlyer(agentId, openHouseId);
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="open-house-flyer.pdf"',
            'Content-Length': pdf.length,
        });
        response.end(pdf);
    }
    getOpenHouseDetail(agentId, openHouseId) {
        return this.openHouseService.findOpenHouseDetail(agentId, openHouseId);
    }
    createOpenHouse(agentId, createOpenHouseDto) {
        return this.openHouseService.create(agentId, createOpenHouseDto);
    }
    updateOpenHouse(agentId, openHouseId, updateOpenHouseDto) {
        return this.openHouseService.update(agentId, openHouseId, updateOpenHouseDto);
    }
    removeBulkOpenHouses(agentId, openHouseIds) {
        return this.openHouseService.removeBulk(agentId, openHouseIds);
    }
    createOpenHouseNote(agentId, openHouseId, createNoteDto) {
        return this.notesService.create(agentId, enums_1.NoteEntityType.OPEN_HOUSE, openHouseId, createNoteDto);
    }
    getAllFeedbackQuestions() {
        return this.feedbackQuestionService.findAll();
    }
    getAgentFeedbackQuestions(agentId) {
        return this.feedbackQuestionService.findAgentDefaultFeedbackQuestions(agentId);
    }
    updateAgentFeedbackQuestions(agentId, questions) {
        return this.feedbackQuestionService.updateAgentQuestions(agentId, questions);
    }
};
exports.AgentAppController = AgentAppController;
__decorate([
    (0, common_1.Patch)('agents'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_agent_dto_1.UpdateAgentDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Post)('assets/upload-url'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_agent_upload_url_dto_1.CreateAgentUploadUrlDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createAgentAssetUploadUrl", null);
__decorate([
    (0, common_1.Post)('assets/complete'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_agent_upload_dto_1.CompleteAgentUploadDto]),
    __metadata("design:returntype", Promise)
], AgentAppController.prototype, "completeAgentAssetUpload", null);
__decorate([
    (0, common_1.Get)('leads'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "findAllAgentLeads", null);
__decorate([
    (0, common_1.Get)('leads/:leadId'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "findLeadDetail", null);
__decorate([
    (0, common_1.Post)('leads'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createLeadFromAgentApp", null);
__decorate([
    (0, common_1.Patch)('leads/status'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)('leadIds')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "updateLeadStatusFromMultiSelect", null);
__decorate([
    (0, common_1.Get)('leads/:leadId/notes'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getLeadNotes", null);
__decorate([
    (0, common_1.Post)('leads/:leadId/notes'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('leadId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createLeadNote", null);
__decorate([
    (0, common_1.Patch)('leads/:leadId/notes/:noteId'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('leadId')),
    __param(2, (0, common_1.Param)('noteId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_note_dto_1.UpdateNoteDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "editNote", null);
__decorate([
    (0, common_1.Get)('properties'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getAllAgentProperties", null);
__decorate([
    (0, common_1.Post)('properties'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_properties_dto_1.CreatePropertiesDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createProperty", null);
__decorate([
    (0, common_1.Patch)('properties/:propertyId'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_properties_dto_1.UpdatePropertiesDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "updateProperty", null);
__decorate([
    (0, common_1.Post)('properties/:propertyId/notes'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createPropertyNote", null);
__decorate([
    (0, common_1.Get)('open-houses'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getAllAgentOpenHouses", null);
__decorate([
    (0, common_1.Get)('open-houses/:openHouseId/feedback-form/pdf'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('openHouseId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AgentAppController.prototype, "downloadOpenHouseFeedbackForm", null);
__decorate([
    (0, common_1.Get)('open-houses/:openHouseId/flyer/pdf'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('openHouseId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AgentAppController.prototype, "downloadOpenHouseFlyer", null);
__decorate([
    (0, common_1.Get)('open-houses/:openHouseId'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('openHouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getOpenHouseDetail", null);
__decorate([
    (0, common_1.Post)('open-houses'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_open_houses_dto_1.CreateOpenHousesDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createOpenHouse", null);
__decorate([
    (0, common_1.Patch)('open-houses/:openHouseId'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('openHouseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_open_houses_dto_1.UpdateOpenHouseDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "updateOpenHouse", null);
__decorate([
    (0, common_1.Delete)('open-houses'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "removeBulkOpenHouses", null);
__decorate([
    (0, common_1.Post)('open-houses/:openHouseId/notes'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Param)('openHouseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "createOpenHouseNote", null);
__decorate([
    (0, common_1.Get)('feedback-questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getAllFeedbackQuestions", null);
__decorate([
    (0, common_1.Get)('feedback-questions/defaults'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "getAgentFeedbackQuestions", null);
__decorate([
    (0, common_1.Patch)('feedback-questions/defaults'),
    __param(0, (0, current_agent_id_decorator_1.CurrentAgentId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], AgentAppController.prototype, "updateAgentFeedbackQuestions", null);
exports.AgentAppController = AgentAppController = __decorate([
    (0, common_1.UseGuards)(agent_auth_guard_1.AgentAuthGuard),
    (0, common_1.Controller)('agent-app'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService,
        open_houses_service_1.OpenHousesService,
        agents_service_1.AgentsService,
        properties_service_1.PropertiesService,
        notes_service_1.NotesService,
        feedback_questions_service_1.FeedbackQuestionsService,
        open_house_pdf_service_1.OpenHousePdfService,
        storage_service_1.StorageService])
], AgentAppController);
//# sourceMappingURL=agent-app.controller.js.map