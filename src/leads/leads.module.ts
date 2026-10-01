import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [],
  providers: [LeadsService, PrismaService],
  exports: [LeadsService],
})
export class LeadsModule {}
