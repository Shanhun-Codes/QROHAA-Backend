import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { NoteEntityType } from 'generated/prisma/enums';
import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { FeedbackQuestionsService } from 'src/feedback-questions/feedback-questions.service';
import { LeadsService } from 'src/leads/leads.service';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
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
  findAllLeadsWithSelectedFeedback(@Param('agentId') agentId: string) {
    return this.leadsService.findAllLeadsWithSelectedFeedback(agentId);
  }

  @Get('agents/:agentId/open-houses')
  getAllAgentOpenHouses(@Param('agentId') agentId: string) {
    return this.openHouseService.findAllByAgentId(agentId);
  }

  @Get('agents/:agentId/properties')
  getAllAgentProperties(@Param('agentId') agentId: string) {
    return this.propertyService.findAllAgentProperties(agentId);
  }

  @Post('/agents/:idd/open-houses')
  createOpenHouse(@Body() createOpenHouseDto: CreateOpenHousesDto) {
    return this.openHouseService.create(createOpenHouseDto);
  }

  @Post('agents')
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
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
