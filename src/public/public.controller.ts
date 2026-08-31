import { Body, Controller, Get, Param } from '@nestjs/common';
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
}
