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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../../generated/prisma/client");
const fs_1 = require("fs");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        const nodeEnv = configService.getOrThrow('NODE_ENV');
        const databaseHost = configService.getOrThrow('DATABASE_HOST');
        const databaseName = configService.getOrThrow('DATABASE_NAME');
        const databaseUser = configService.getOrThrow('DATABASE_USER');
        const databasePassword = configService.getOrThrow('DATABASE_PASSWORD');
        const databaseUrl = `postgresql://${encodeURIComponent(databaseUser)}` +
            `:${encodeURIComponent(databasePassword)}` +
            `@${databaseHost}:5432/${databaseName}`;
        const adapter = new adapter_pg_1.PrismaPg({
            connectionString: databaseUrl,
            ...(nodeEnv === 'qa' || nodeEnv === 'prod'
                ? {
                    ssl: {
                        ca: (0, fs_1.readFileSync)('./certs/rds-ca-bundle.pem', 'utf8'),
                        rejectUnauthorized: true,
                    },
                }
                : {}),
        });
        super({ adapter });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map