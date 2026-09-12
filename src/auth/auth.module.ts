import { Module } from '@nestjs/common';

import { CognitoAuthGuard } from './cognito-auth.guard';
import { CognitoAuthService } from './cognito-auth.service';
import { AuthUserService } from './auth-user.service';
import { AgentAuthGuard } from './agent-auth.guard';

@Module({
  providers: [
    CognitoAuthService,
    CognitoAuthGuard,
    AuthUserService,
    AgentAuthGuard,
  ],
  exports: [
    CognitoAuthService,
    CognitoAuthGuard,
    AuthUserService,
    AgentAuthGuard,
  ],
})
export class AuthModule {}
