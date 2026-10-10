import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [],
  providers: [AgentsService, PrismaService],
  exports: [AgentsService],
})
export class AgentsModule {}
