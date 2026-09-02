import { Body, Controller, Get, Post } from '@nestjs/common';
import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { LeadsService } from 'src/leads/leads.service';
import { CreateOpenHousesDto } from 'src/open-houses/dto/create-open-houses.dto';
import { OpenHousesService } from 'src/open-houses/open-houses.service';
import { CreatePropertiesDto } from 'src/properties/dto/create-properties.dto';
import { PropertiesService } from 'src/properties/properties.service';

@Controller('agent-app')
export class AgentAppController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly openHouseService: OpenHousesService,
    private readonly agentsService: AgentsService,
    private readonly propertyService: PropertiesService,
  ) {}

  @Get('leads')
  findLeads() {
    return this.leadsService.findAllLeadsWithSelectedFeedback();
  }

  @Post('open-houses')
  createOpenHouse(@Body() createOpenHouseDto: CreateOpenHousesDto) {
    return this.openHouseService.create(createOpenHouseDto);
  }

  @Post('agents')
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Post('properties')
  create(@Body() createPropertyDto: CreatePropertiesDto) {
    return this.propertyService.create(createPropertyDto);
  }
}
