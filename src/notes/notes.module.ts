import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [NotesController],
  providers: [NotesService, PrismaService],
  exports: [NotesService],
})
export class NotesModule {}
