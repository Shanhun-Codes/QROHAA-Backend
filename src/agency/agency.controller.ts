import { AgencySettingsService } from './agency-settings.service';
import { UpdateAgencySettingsDto } from './dto/update-agency-settings.dto';
import { AgencyLogoUploadDto } from './dto/agency-logo-upload.dto';
import { CompleteAgencyLogoDto } from './dto/complete-agency-logo.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CognitoAuthGuard } from 'src/auth/cognito-auth.guard';
import { CurrentCognitoSub } from 'src/auth/current-cognito-sub.decorator';
import { AgencyService } from './agency.service';
import { AgencyMemberStatusDto } from './dto/agency-member-status.dto';
import { InviteAgencyMemberDto } from './dto/invite-agency-member.dto';
@Controller('agency-app')
@UseGuards(CognitoAuthGuard)
export class AgencyController {
  constructor(
    private readonly service: AgencyService,
    private readonly settings: AgencySettingsService,
  ) {}
  @Get('agencies/:agencyId/settings') getSettings(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agencyId: string,
  ) {
    return this.settings.get(sub, agencyId);
  }
  @Patch('agencies/:agencyId/settings') updateSettings(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agencyId: string,
    @Body() dto: UpdateAgencySettingsDto,
  ) {
    return this.settings.update(sub, agencyId, dto);
  }
  @Post('agencies/:agencyId/logo/upload-url') uploadLogo(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agencyId: string,
    @Body() dto: AgencyLogoUploadDto,
  ) {
    return this.settings.uploadUrl(sub, agencyId, dto.contentType);
  }
  @Post('agencies/:agencyId/logo/complete') completeLogo(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agencyId: string,
    @Body() dto: CompleteAgencyLogoDto,
  ) {
    return this.settings.completeLogo(sub, agencyId, dto.key);
  }
  @Get('agencies') list(@CurrentCognitoSub() sub: string) {
    return this.service.listAgencies(sub);
  }
  @Get('agencies/:agencyId') overview(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') id: string,
  ) {
    return this.service.overview(sub, id);
  }
  @Post('agencies/:agencyId/invitations') invite(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') id: string,
    @Body() dto: InviteAgencyMemberDto,
  ) {
    return this.service.invite(sub, id, dto);
  }
  @Post('agencies/:agencyId/invitations/:id/resend') resend(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agency: string,
    @Param('id') id: string,
  ) {
    return this.service.resend(sub, agency, id);
  }
  @Patch('agencies/:agencyId/invitations/:id/revoke') revoke(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agency: string,
    @Param('id') id: string,
  ) {
    return this.service.revoke(sub, agency, id);
  }
  @Patch('agencies/:agencyId/members/:id/status') status(
    @CurrentCognitoSub() sub: string,
    @Param('agencyId') agency: string,
    @Param('id') id: string,
    @Body() dto: AgencyMemberStatusDto,
  ) {
    return this.service.setStatus(sub, agency, id, dto.status);
  }
}
