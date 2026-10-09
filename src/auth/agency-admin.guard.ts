import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserService } from './auth-user.service';
import { CognitoAuthGuard } from './cognito-auth.guard';

@Injectable()
export class AgencyAdminGuard implements CanActivate {
  constructor(
    private readonly cognitoAuthGuard: CognitoAuthGuard,
    private readonly authUserService: AuthUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.cognitoAuthGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<Request>();
    const cognitoSub = request['user']?.cognitoSub;
    const user = await this.authUserService.requireAgencyAdmin(cognitoSub);
    request['user'] = {
      ...request['user'],
      agencyId: user.agencyId,
      role: 'AGENCY_ADMIN',
    };
    return true;
  }
}
