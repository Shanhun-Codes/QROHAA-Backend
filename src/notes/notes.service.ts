import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoteEntityType } from '../../generated/prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    agentId: string,
    subjectType: NoteEntityType,
    subjectId: string,
    createNoteDto: CreateNoteDto,
  ) {
    await this.validateSubject(agentId, subjectType, subjectId);

    return this.prisma.note.create({
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
