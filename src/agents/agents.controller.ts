import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { ReplaceAgentFeedbackQuestionsDto } from './dto/replace-agent-feedback-questions.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Get(':agentId/feedback-questions')
  getFeedbackQuestions(@Param('agentId') agentId: string) {
    return this.agentsService.getFeedbackQuestions(agentId);
  }

  @Put(':agentId/feedback-questions')
  replaceFeedbackQuestions(@Param('agentId') agentId: string, @Body() dto: ReplaceAgentFeedbackQuestionsDto) {
    return this.agentsService.replaceFeedbackQuestions(agentId, dto.questions);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(+id);
  }
}
