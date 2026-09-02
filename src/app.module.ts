import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { PropertyModule } from './property/property.module';
import { PrismaService } from './prisma/prisma.service';
import { OpenHouseModule } from './open-house/open-house.module';
import { PublicModule } from './public/public.module';
import { FeedbackQuestionsModule } from './feedback-questions/feedback-questions.module';
import { FeedbackSubmissionModule } from './feedback-submission/feedback-submission.module';
import { LeadsModule } from './leads/leads.module';
import { AgentAppModule } from './agent-app/agent-app.module';

@Module({
  imports: [
    AgentsModule,
    PropertyModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'local'}`, '.env.local'],
    }),
    PropertyModule,
    OpenHouseModule,
    PublicModule,
    FeedbackQuestionsModule,
    FeedbackSubmissionModule,
    LeadsModule,
    AgentAppModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
