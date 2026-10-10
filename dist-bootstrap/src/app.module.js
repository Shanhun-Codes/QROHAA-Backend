"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const agents_module_1 = require("./agents/agents.module");
const open_houses_module_1 = require("./open-houses/open-houses.module");
const public_module_1 = require("./public/public.module");
const feedback_questions_module_1 = require("./feedback-questions/feedback-questions.module");
const leads_module_1 = require("./leads/leads.module");
const agent_app_module_1 = require("./agent-app/agent-app.module");
const properties_module_1 = require("./properties/properties.module");
const feedback_submissions_module_1 = require("./feedback-submissions/feedback-submissions.module");
const notes_module_1 = require("./notes/notes.module");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const onboarding_module_1 = require("./onboarding/onboarding.module");
const storage_module_1 = require("./storage/storage.module");
const brokerage_module_1 = require("./brokerage/brokerage.module");
const platform_admin_module_1 = require("./platform-admin/platform-admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [`.env.${process.env.NODE_ENV ?? 'local'}`, '.env.local'],
            }),
            agents_module_1.AgentsModule,
            properties_module_1.PropertiesModule,
            open_houses_module_1.OpenHousesModule,
            public_module_1.PublicModule,
            feedback_questions_module_1.FeedbackQuestionsModule,
            feedback_submissions_module_1.FeedbackSubmissionsModule,
            leads_module_1.LeadsModule,
            agent_app_module_1.AgentAppModule,
            notes_module_1.NotesModule,
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            onboarding_module_1.OnboardingModule,
            storage_module_1.StorageModule,
            brokerage_module_1.BrokerageModule,
            platform_admin_module_1.PlatformAdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map