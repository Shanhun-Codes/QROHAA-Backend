"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenHousesModule = void 0;
const common_1 = require("@nestjs/common");
const open_houses_service_1 = require("./open-houses.service");
const prisma_service_1 = require("src/prisma/prisma.service");
const open_house_pdf_service_1 = require("./open-house-pdf.service");
const agents_module_1 = require("src/agents/agents.module");
let OpenHousesModule = class OpenHousesModule {
};
exports.OpenHousesModule = OpenHousesModule;
exports.OpenHousesModule = OpenHousesModule = __decorate([
    (0, common_1.Module)({
        imports: [agents_module_1.AgentsModule],
        controllers: [],
        providers: [open_houses_service_1.OpenHousesService, prisma_service_1.PrismaService, open_house_pdf_service_1.OpenHousePdfService],
        exports: [open_houses_service_1.OpenHousesService, open_house_pdf_service_1.OpenHousePdfService],
    })
], OpenHousesModule);
//# sourceMappingURL=open-houses.module.js.map