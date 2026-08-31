import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [AgentsController],
  providers: [AgentsService, PrismaService],
})
export class AgentsModule {}
