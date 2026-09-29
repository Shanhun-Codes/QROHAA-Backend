import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { AgentsModule } from 'src/agents/agents.module';

@Module({
  imports: [AuthModule, AgentsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
