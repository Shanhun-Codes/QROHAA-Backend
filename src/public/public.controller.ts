import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { SubmitPublicFeedbackDto } from './dto/submit-public-feedback.dto';

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

  @Post('agents/:slug/open-houses/:publicCode/feedback')
  submitFeedback(
    @Param('slug') slug: string,
    @Param('publicCode') publicCode: string,
    @Body() submitFeedbackDto: SubmitPublicFeedbackDto,
  ) {
    return this.publicService.submitFeedback(slug, publicCode, submitFeedbackDto);
  }
}