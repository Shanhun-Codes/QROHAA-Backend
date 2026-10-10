"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAppModule = void 0;
const common_1 = require("@nestjs/common");
const leads_module_1 = require("src/leads/leads.module");
const open_houses_module_1 = require("src/open-houses/open-houses.module");
const agents_module_1 = require("src/agents/agents.module");
const properties_module_1 = require("src/properties/properties.module");
const agent_app_controller_1 = require("./agent-app.controller");
const feedback_questions_module_1 = require("src/feedback-questions/feedback-questions.module");
const notes_module_1 = require("src/notes/notes.module");
const auth_module_1 = require("src/auth/auth.module");
const storage_module_1 = require("src/storage/storage.module");
let AgentAppModule = class AgentAppModule {
};
exports.AgentAppModule = AgentAppModule;
exports.AgentAppModule = AgentAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            leads_module_1.LeadsModule,
            open_houses_module_1.OpenHousesModule,
            agents_module_1.AgentsModule,
            properties_module_1.PropertiesModule,
            feedback_questions_module_1.FeedbackQuestionsModule,
            notes_module_1.NotesModule,
            auth_module_1.AuthModule,
            storage_module_1.StorageModule,
        ],
        controllers: [agent_app_controller_1.AgentAppController],
    })
], AgentAppModule);
//# sourceMappingURL=agent-app.module.js.map