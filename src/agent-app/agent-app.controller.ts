import { Controller, Get } from '@nestjs/common';
import { LeadsService } from 'src/leads/leads.service';

@Controller('agent-app')
export class AgentAppController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('leads')
  findLeads() {
    return this.leadsService.findAllLeadsWithSelectedFeedback();
  }
}