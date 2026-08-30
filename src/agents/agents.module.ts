import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
