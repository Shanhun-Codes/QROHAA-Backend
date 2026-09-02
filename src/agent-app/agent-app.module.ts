import { Module } from '@nestjs/common';
import { LeadsModule } from 'src/leads/leads.module';
import { OpenHousesModule } from 'src/open-houses/open-houses.module';
import { AgentsModule } from 'src/agents/agents.module';
import { PropertiesModule } from 'src/properties/properties.module';
import { AgentAppController } from './agent-app.controller';
import { FeedbackQuestionsModule } from 'src/feedback-questions/feedback-questions.module';

@Module({
  imports: [
    LeadsModule,
    OpenHousesModule,
    AgentsModule,
    PropertiesModule,
    FeedbackQuestionsModule,
  ],
  controllers: [AgentAppController],
})
export class AgentAppModule {}
