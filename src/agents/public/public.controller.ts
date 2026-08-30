import { Controller, Get, Param } from '@nestjs/common';
import { AgentsService } from '../agents.service';

@Controller('public/agents')
export class PublicController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.agentsService.findPublicBySlug(slug);
  }
}
