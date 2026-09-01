import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('agents/:slug')
  findAgent(@Param('slug') slug: string) {
    return this.publicService.findPublicAgentBySlug(slug);
  }

  @Get('agents/:slug/open-houses/:publicCode')
  findOpenHouseByPublicCode(@Param('publicCode') publicCode: string) {
    return this.publicService.findOpenHouseByPublicCode(publicCode);
  }

  @Get('/agents/:slug/open-houses/:publicCode/configuration') 
  getConfigurationData(@Param('slug') slug: string, @Param('publicCode') publicCode: string) {
    return this.publicService.getConfigurationData(slug, publicCode);
  }

  @Post('/agents/:slug/open-house/:publicCode/feedback-submission')
  submitFeedback(@Param('slug') slug: string, @Param('publicCode') publicCode: string, @Body() createFeedbackSubmissionDto: any) {
    return this.publicService.submitFeedback(slug, publicCode, createFeedbackSubmissionDto);
}
}