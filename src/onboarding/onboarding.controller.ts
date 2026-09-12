import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { AuthUserService } from 'src/auth/auth-user.service';
import { CognitoAuthGuard } from 'src/auth/cognito-auth.guard';

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

    if (!user?.agent) {
      return {
        hasAgent: false,
      };
    }

    return {
      hasAgent: true,
      agent: user.agent,
    };
  }

  @Post('agent')
  async createAgent(
    @Req() request: Request,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    const cognitoSub = request['user']?.cognitoSub;

    if (!cognitoSub) {
      throw new UnauthorizedException('Missing Cognito sub');
    }

    return this.onboardingService.createAgentForUser(
      cognitoSub,
      createAgentDto,
    );
  }
}
