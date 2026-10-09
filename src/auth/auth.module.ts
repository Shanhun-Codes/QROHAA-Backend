import { Module } from '@nestjs/common';

import { CognitoAuthGuard } from './cognito-auth.guard';
import { CognitoAuthService } from './cognito-auth.service';
import { AuthUserService } from './auth-user.service';
import { AgentAuthGuard } from './agent-auth.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { AgencyAdminGuard } from './agency-admin.guard';
import { AgentsModule } from 'src/agents/agents.module';

@Module({
  imports: [AgentsModule],
  providers: [
    CognitoAuthService,
    CognitoAuthGuard,
    AuthUserService,
    AgentAuthGuard,
    PlatformAdminGuard,
    AgencyAdminGuard,
  ],
  exports: [
    CognitoAuthService,
    CognitoAuthGuard,
    AuthUserService,
    AgentAuthGuard,
    PlatformAdminGuard,
    AgencyAdminGuard,
  ],
})
export class AuthModule {}
