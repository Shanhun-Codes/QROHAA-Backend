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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("../../generated/prisma/client");
let NotesService = class NotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async editNote(agentId, leadId, noteId, updateNoteDto) {
        await this.validateSubject(agentId, client_1.NoteEntityType.LEAD, leadId);
        const updated = await this.prisma.note.updateMany({
            where: {
                id: noteId,
                agentId,
                subjectType: client_1.NoteEntityType.LEAD,
                subjectId: leadId,
            },
            data: {
                body: updateNoteDto.body,
            },
        });
        if (updated.count !== 1) {
            throw new common_1.NotFoundException('Note not found.');
        }
        return this.findAllBySubject(agentId, client_1.NoteEntityType.LEAD, leadId);
    }
    async create(agentId, subjectType, subjectId, createNoteDto) {
        await this.validateSubject(agentId, subjectType, subjectId);
        await this.prisma.note.create({
            data: {
                body: createNoteDto.body,
                subjectType,
                subjectId,
                agentId,
                mentions: {
                    create: createNoteDto.mentions ?? [],
                },
            },
            include: {
                mentions: true,
            },
        });
        return await this.findAllBySubject(agentId, subjectType, subjectId);
    }
    async findAllBySubject(agentId, subjectType, subjectId) {
        await this.validateSubject(agentId, subjectType, subjectId);
        return this.prisma.note.findMany({
            where: {
                agentId,
                subjectType,
                subjectId,
            },
            include: {
                mentions: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(agentId, noteId) {
        const note = await this.prisma.note.findFirst({
            where: {
                id: noteId,
                agentId,
            },
            include: {
                mentions: true,
            },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        return note;
    }
    async validateSubject(agentId, subjectType, subjectId) {
        let subject = null;
        switch (subjectType) {
            case client_1.NoteEntityType.LEAD:
                subject = await this.prisma.lead.findFirst({
                    where: {
                        id: subjectId,
                        agentId,
                    },
                    select: {
                        id: true,
                    },
                });
                break;
            case client_1.NoteEntityType.PROPERTY:
                subject = await this.prisma.property.findFirst({
                    where: {
                        id: subjectId,
                        agentId,
                    },
                    select: {
                        id: true,
                    },
                });
                break;
            case client_1.NoteEntityType.OPEN_HOUSE:
                subject = await this.prisma.openHouse.findFirst({
                    where: {
                        id: subjectId,
                        agentId,
                    },
                    select: {
                        id: true,
                    },
                });
                break;
        }
        if (!subject) {
            throw new common_1.NotFoundException('Note subject not found');
        }
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map