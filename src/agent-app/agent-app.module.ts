import { Module } from '@nestjs/common';
import { LeadsModule } from 'src/leads/leads.module';
import { OpenHousesModule } from 'src/open-houses/open-houses.module';
import { AgentsModule } from 'src/agents/agents.module';
import { PropertiesModule } from 'src/properties/properties.module';

@Module({
  imports: [LeadsModule, OpenHousesModule, AgentsModule, PropertiesModule],
  controllers: [],
})
export class AgentAppModule {}
