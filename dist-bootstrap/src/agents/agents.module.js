"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const agents_service_1 = require("./agents.service");
const prisma_service_1 = require("src/prisma/prisma.service");
const storage_module_1 = require("src/storage/storage.module");
let AgentsModule = class AgentsModule {
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, storage_module_1.StorageModule],
        controllers: [],
        providers: [agents_service_1.AgentsService, prisma_service_1.PrismaService],
        exports: [agents_service_1.AgentsService],
    })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map