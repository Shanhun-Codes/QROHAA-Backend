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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("src/prisma/prisma.service");
let PropertiesService = class PropertiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(agentId, createPropertyDto) {
        return this.prisma.property.create({
            data: {
                street: createPropertyDto.street,
                street2: createPropertyDto.street2,
                city: createPropertyDto.city,
                state: createPropertyDto.state,
                zip: createPropertyDto.zip,
                listingPriceCents: createPropertyDto.listingPriceCents,
                agent: {
                    connect: {
                        id: agentId,
                    },
                },
            },
        });
    }
    findAll() {
        return this.prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    findAllAgentProperties(agentId) {
        return this.prisma.property.findMany({
            where: {
                agentId,
            },
        });
    }
    findPropertyById(id) {
        return this.prisma.property.findUnique({ where: { id } });
    }
    update(agentId, propertyId, updatePropertyDto) {
        return this.prisma.property.update({
            where: {
                id: propertyId,
                agentId,
            },
            data: updatePropertyDto,
        });
    }
    remove(id) {
        return `This action removes a #${id} property`;
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map