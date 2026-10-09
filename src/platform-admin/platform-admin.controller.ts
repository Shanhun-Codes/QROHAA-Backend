import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentCognitoSub } from 'src/auth/current-cognito-sub.decorator';
import { PlatformAdminGuard } from 'src/auth/platform-admin.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { GrantAccessDto } from './dto/grant-access.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { PlatformAdminService } from './platform-admin.service';

@UseGuards(PlatformAdminGuard)
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Post('invitations')
  createInvitation(
    @CurrentCognitoSub() actorSub: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.platformAdminService.createInvitation(actorSub, dto);
  }

  @Get('invitations')
  listInvitations(@CurrentCognitoSub() actorSub: string) {
    return this.platformAdminService.listInvitations(actorSub);
  }

  @Patch('invitations/:invitationId/revoke')
  revokeInvitation(
    @CurrentCognitoSub() actorSub: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.platformAdminService.revokeInvitation(actorSub, invitationId);
  }

  @Get('users')
  listUsers(@CurrentCognitoSub() actorSub: string) {
    return this.platformAdminService.listUsers(actorSub);
  }

  @Get('agencies')
  listAgencies(@CurrentCognitoSub() actorSub: string) {
    return this.platformAdminService.listAgencies(actorSub);
  }

  @Patch('users/:userId/status')
  updateAccountStatus(
    @CurrentCognitoSub() actorSub: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.platformAdminService.updateAccountStatus(
      actorSub,
      userId,
      dto.status,
    );
  }

  @Post('users/:userId/access')
  grantUserAccess(
    @CurrentCognitoSub() actorSub: string,
    @Param('userId') userId: string,
    @Body() dto: GrantAccessDto,
  ) {
    return this.platformAdminService.grantUserAccess(actorSub, userId, dto);
  }

  @Post('agencies/:agencyId/access')
  grantAgencyAccess(
    @CurrentCognitoSub() actorSub: string,
    @Param('agencyId') agencyId: string,
    @Body() dto: GrantAccessDto,
  ) {
    return this.platformAdminService.grantAgencyAccess(actorSub, agencyId, dto);
  }

  @Patch('access/:entitlementId/revoke')
  revokeAccess(
    @CurrentCognitoSub() actorSub: string,
    @Param('entitlementId') entitlementId: string,
  ) {
    return this.platformAdminService.revokeAccess(actorSub, entitlementId);
  }

  @Get('audit')
  listAuditLogs(@CurrentCognitoSub() actorSub: string) {
    return this.platformAdminService.listAuditLogs(actorSub);
  }
}
