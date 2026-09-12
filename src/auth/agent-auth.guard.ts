import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthUserService } from './auth-user.service';
import { CognitoAuthGuard } from './cognito-auth.guard';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(
    private readonly cognitoAuthGuard: CognitoAuthGuard,
    private readonly authUserService: AuthUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.cognitoAuthGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<Request>();

    const cognitoSub = request['user']?.cognitoSub;

    if (!cognitoSub) {
      throw new UnauthorizedException('Missing Cognito sub');
    }

    const agent = await this.authUserService.getAgentByCognitoSub(cognitoSub);

    request['user'] = {
      ...request['user'],
      agentId: agent.id,
    };

    return true;
  }
}
