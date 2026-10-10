import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [NotesService, PrismaService],
  exports: [NotesService],
})
export class NotesModule {}
