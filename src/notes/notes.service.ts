import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteEntityType } from '../../generated/prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async editNote(
    agentId: string,
    leadId: string,
    noteId: string,
    updateNoteDto: UpdateNoteDto,
  ) {
    await this.validateSubject(agentId, NoteEntityType.LEAD, leadId);

    await this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        body: updateNoteDto.body,
      },
    });

    return this.findAllBySubject(agentId, NoteEntityType.LEAD, leadId);
  }

  async create(
    agentId: string,
    subjectType: NoteEntityType,
    subjectId: string,
    createNoteDto: CreateNoteDto,
  ) {
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

  async findAllBySubject(
    agentId: string,
    subjectType: NoteEntityType,
    subjectId: string,
  ) {
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

  async findOne(agentId: string, noteId: string) {
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
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  private async validateSubject(
    agentId: string,
    subjectType: NoteEntityType,
    subjectId: string,
  ): Promise<void> {
    let subject: { id: string } | null = null;

    switch (subjectType) {
      case NoteEntityType.LEAD:
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

      case NoteEntityType.PROPERTY:
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

      case NoteEntityType.OPEN_HOUSE:
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
      throw new NotFoundException('Note subject not found');
    }
  }
}
