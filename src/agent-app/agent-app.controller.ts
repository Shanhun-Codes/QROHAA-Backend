import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LeadStatusType, NoteEntityType } from 'generated/prisma/enums';
import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { CreateLeadDto } from 'src/leads/dto/create-lead.dto';
import { LeadsService } from 'src/leads/leads.service';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
import { UpdateNoteDto } from 'src/notes/dto/update-note.dto';
import { NotesService } from 'src/notes/notes.service';
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
    private readonly notesService: NotesService,
  ) {}

  // @Get('leads')
  // findLeads() {
  //   return this.leadsService.findAllLeadsWithSelectedFeedback();
  // }

  // temporary do not push to public
  @Get('agents')
  findAllAgents() {
    return this.agentsService.findAll();
  }

  @Get('agents/:agentId/leads')
  findAllAgentLeads(@Param('agentId') agentId: string) {
    return this.leadsService.findAllAgentLeads(agentId);
  }

  @Get('agents/:agentId/leads/:leadId')
  findLeadDetail(
    @Param('agentId') agentId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.findLeadDetail(agentId, leadId);
  }

  @Get('agents/:agentId/open-houses')
  getAllAgentOpenHouses(@Param('agentId') agentId: string) {
    return this.openHouseService.findAllByAgentId(agentId);
  }

  @Get('agents/:agentId/properties')
  getAllAgentProperties(@Param('agentId') agentId: string) {
    return this.propertyService.findAllAgentProperties(agentId);
  }

  @Post('/agents/:id/open-houses')
  createOpenHouse(@Body() createOpenHouseDto: CreateOpenHousesDto) {
    return this.openHouseService.create(createOpenHouseDto);
  }

  @Post('agents')
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Post('leads')
  createLeadFromAgentApp(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Post('properties')
  createProperty(@Body() createPropertyDto: CreatePropertiesDto) {
    return this.propertyService.create(createPropertyDto);
  }

  @Post('agents/:agentId/leads/:leadId/notes')
  createLeadNote(
    @Param('agentId') agentId: string,
    @Param('leadId') leadId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(
      agentId,
      NoteEntityType.LEAD,
      leadId,
      createNoteDto,
    );
  }

  @Patch('agents/:agentId/leads/status')
  updateLeadStatusFromMultiSelect(
    @Param('agentId') agentId: string,
    @Body('leadIds') leadIds: string[],
    @Body('status') status: LeadStatusType,
  ) {
    return this.leadsService.updateLeadStatusFromMultiSelect(
      agentId,
      leadIds,
      status,
    );
  }

  @Get('agents/:agentId/leads/:leadId/notes')
  getLeadNotes(
    @Param('agentId') agentId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.notesService.findAllBySubject(
      agentId,
      NoteEntityType.LEAD,
      leadId,
    );
  }

  @Post('agents/:agentId/properties/:propertyId/notes')
  createPropertyNote(
    @Param('agentId') agentId: string,
    @Param('propertyId') propertyId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(
      agentId,
      NoteEntityType.PROPERTY,
      propertyId,
      createNoteDto,
    );
  }

  @Post('agents/:agentId/open-houses/:openHouseId/notes')
  createOpenHouseNote(
    @Param('agentId') agentId: string,
    @Param('openHouseId') openHouseId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(
      agentId,
      NoteEntityType.OPEN_HOUSE,
      openHouseId,
      createNoteDto,
    );
  }
}
