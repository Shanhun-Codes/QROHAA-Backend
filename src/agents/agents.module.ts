import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PublicController } from './public/public.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [AgentsController, PublicController],
  providers: [AgentsService, PrismaService],
})
export class AgentsModule {}
