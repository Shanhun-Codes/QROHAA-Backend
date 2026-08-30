import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PublicController } from './public/public.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AgentsController, PublicController],
  providers: [AgentsService],
})
export class AgentsModule {}
