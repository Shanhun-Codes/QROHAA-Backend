import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthUserService } from 'src/auth/auth-user.service';
import { CognitoAuthGuard } from 'src/auth/cognito-auth.guard';

import { RedeemInvitationDto } from './dto/redeem-invitation.dto';
import { OnboardingService } from './onboarding.service';

@UseGuards(CognitoAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly authUserService: AuthUserService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Get('me')
  async getMe(@Req() request: Request) {
    const cognitoSub = request['user']?.cognitoSub;

    if (!cognitoSub) {
      throw new UnauthorizedException('Missing Cognito sub');
    }

    const user = await this.authUserService.getUserByCognitoSub(cognitoSub);

    if (!user) {
      return {
        hasAgent: false,
        accessGranted: false,
        invitationRequired: true,
      };
    }

    const isPlatformAdmin =
      user.role === 'PLATFORM_ADMIN' && user.status === 'ACTIVE';

    if (!user.accessGranted && !isPlatformAdmin) {
      return {
        hasAgent: false,
        accessGranted: false,
        accessStatus: user.accessStatus,
        role: user.role,
        status: user.status,
      };
    }

    return {
      hasAgent: Boolean(user.agent),
      accessGranted: true,
      role: user.role,
      status: user.status,
      agent: user.agent ?? null,
    };
  }

  @Post('agent')
  async redeemInvitation(
    @Req() request: Request,
    @Headers('x-cognito-id-token') idToken: string | undefined,
    @Body() redeemInvitationDto: RedeemInvitationDto,
  ) {
    const cognitoSub = request['user']?.cognitoSub;

    if (!cognitoSub) {
      throw new UnauthorizedException('Missing Cognito sub');
    }

    if (!idToken) {
      throw new UnauthorizedException('Missing Cognito ID token');
    }

    return this.onboardingService.redeemInvitation(
      cognitoSub,
      idToken,
      redeemInvitationDto,
    );
  }
}
