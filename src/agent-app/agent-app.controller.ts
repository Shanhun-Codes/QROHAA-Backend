import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AgentsService } from 'src/agents/agents.service';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { CreateFeedbackQuestionDto } from 'src/feedback-questions/dto/create-feedback-question.dto';
import { UpdateFeedbackQuestionDto } from 'src/feedback-questions/dto/update-feedback-question.dto';
import { FeedbackQuestionsService } from 'src/feedback-questions/feedback-questions.service';
import { CreateLeadDto } from 'src/leads/dto/create-lead.dto';
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
    private readonly feedbackQuestionsService: FeedbackQuestionsService,
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
  createProperty(@Body() createPropertyDto: CreatePropertiesDto) {
    return this.propertyService.create(createPropertyDto);
  }

  // @Patch('feedback-questions/:questionId')
  // updateFeedbackQuestion(
  //   @CurrentAgent() agent: AuthenticatedAgent,
  //   @Param('questionId') questionId: string,
  //   @Body() dto: UpdateAgentFeedbackQuestionDto,
  // ) {
  //   return this.agentFeedbackQuestionsService.updateAgentQuestion(
  //     agent.id,
  //     questionId,
  //     dto,
  //   );
  // }
}
