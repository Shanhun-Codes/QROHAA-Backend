import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { PrismaService } from './prisma/prisma.service';
import { OpenHousesModule } from './open-houses/open-houses.module';
import { PublicModule } from './public/public.module';
import { FeedbackQuestionsModule } from './feedback-questions/feedback-questions.module';
import { FeedbackSubmissionModule } from './feedback-submission/feedback-submission.module';
import { LeadsModule } from './leads/leads.module';
import { AgentAppModule } from './agent-app/agent-app.module';
import { PropertiesModule } from './properties/properties.module';

@Module({
  imports: [
    AgentsModule,
    PropertiesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'local'}`, '.env.local'],
    }),
    PropertiesModule,
    OpenHousesModule,
    PublicModule,
    FeedbackQuestionsModule,
    FeedbackSubmissionModule,
    LeadsModule,
    AgentAppModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
