import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LeadStatusType, NoteEntityType } from 'generated/prisma/enums';
import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { AgentAuthGuard } from 'src/auth/agent-auth.guard';
import { CurrentAgentId } from 'src/auth/current-agent-id.decorator';
import { FeedbackQuestionsService } from 'src/feedback-questions/feedback-questions.service';
import { CreateLeadDto } from 'src/leads/dto/create-lead.dto';
import { LeadsService } from 'src/leads/leads.service';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
import { UpdateNoteDto } from 'src/notes/dto/update-note.dto';
import { NotesService } from 'src/notes/notes.service';
import { CreateOpenHousesDto } from 'src/open-houses/dto/create-open-houses.dto';
import { OpenHousesService } from 'src/open-houses/open-houses.service';
import { CreatePropertiesDto } from 'src/properties/dto/create-properties.dto';
import { PropertiesService } from 'src/properties/properties.service';

@UseGuards(AgentAuthGuard)
@Controller('agent-app')
export class AgentAppController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly openHouseService: OpenHousesService,
    private readonly agentsService: AgentsService,
    private readonly propertyService: PropertiesService,
    private readonly notesService: NotesService,
    private readonly feedbackQuestionService: FeedbackQuestionsService,
  ) {}

  // ======================================================
  // TEMPORARY / DEVELOPMENT ROUTES
  // ======================================================

  // @Get('leads')
  // findLeads() {
  //   return this.leadsService.findAllLeadsWithSelectedFeedback();
  // }

  // temporary do not push to public
  @Get('agents')
  findAllAgents() {
    return this.agentsService.findAll();
  }

  // ======================================================
  // AGENTS
  // ======================================================

  @Post('agents')
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  // ======================================================
  // LEADS
  // ======================================================

  @Get('leads')
  findAllAgentLeads(@CurrentAgentId() agentId: string) {
    return this.leadsService.findAllAgentLeads(agentId);
  }

  @Get('leads/:leadId')
  findLeadDetail(
    @CurrentAgentId() agentId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.findLeadDetail(agentId, leadId);
  }

  @Post('leads')
  createLeadFromAgentApp(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Patch('leads/status')
  updateLeadStatusFromMultiSelect(
    @CurrentAgentId() agentId: string,
    @Body('leadIds') leadIds: string[],
    @Body('status') status: LeadStatusType,
  ) {
    return this.leadsService.updateLeadStatusFromMultiSelect(
      agentId,
      leadIds,
      status,
    );
  }

  // ======================================================
  // LEAD NOTES
  // ======================================================

  @Get('leads/:leadId/notes')
  getLeadNotes(
    @CurrentAgentId() agentId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.notesService.findAllBySubject(
      agentId,
      NoteEntityType.LEAD,
      leadId,
    );
  }

  @Post('leads/:leadId/notes')
  createLeadNote(
    @CurrentAgentId() agentId: string,
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

  @Patch('leads/:leadId/notes/:noteId')
  editNote(
    @CurrentAgentId() agentId: string,
    @Param('leadId') leadId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.editNote(agentId, leadId, noteId, updateNoteDto);
  }

  // ======================================================
  // PROPERTIES
  // ======================================================

  @Get('properties')
  getAllAgentProperties(@CurrentAgentId() agentId: string) {
    return this.propertyService.findAllAgentProperties(agentId);
  }

  @Post('properties')
  createProperty(
    @CurrentAgentId() agentId: string,
    @Body() createPropertyDto: CreatePropertiesDto,
  ) {
    return this.propertyService.create(agentId, createPropertyDto);
  }

  // ======================================================
  // PROPERTY NOTES
  // ======================================================

  @Post('properties/:propertyId/notes')
  createPropertyNote(
    @CurrentAgentId() agentId: string,
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

  // ======================================================
  // OPEN HOUSES
  // ======================================================

  @Get('open-houses')
  getAllAgentOpenHouses(@CurrentAgentId() agentId: string) {
    return this.openHouseService.findAllByAgentId(agentId);
  }

  @Post('open-houses')
  createOpenHouse(@Body() createOpenHouseDto: CreateOpenHousesDto) {
    return this.openHouseService.create(createOpenHouseDto);
  }

  // ======================================================
  // OPEN HOUSE NOTES
  // ======================================================

  @Post('open-houses/:openHouseId/notes')
  createOpenHouseNote(
    @CurrentAgentId() agentId: string,
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

  // ======================================================
  // FEEDBACK QUESTIONS
  // ======================================================

  @Get('feedback-questions')
  getAllFeedbackQuestions() {
    return this.feedbackQuestionService.findAll();
  }

  @Get('feedback-questions/defaults')
  getAgentFeedbackQuestions(@CurrentAgentId() agentId: string) {
    return this.feedbackQuestionService.findAgentDefaultFeedbackQuestions(
      agentId,
    );
  }
}
