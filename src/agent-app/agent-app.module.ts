import { Module } from '@nestjs/common';
import { LeadsModule } from 'src/leads/leads.module';
import { AgentAppController } from './agent-app.controller';

@Module({
  imports: [LeadsModule],
  controllers: [AgentAppController],
})
export class AgentAppModule {}
