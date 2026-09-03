import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { PrismaService } from './prisma/prisma.service';
import { OpenHousesModule } from './open-houses/open-houses.module';
import { PublicModule } from './public/public.module';
import { FeedbackQuestionsModule } from './feedback-questions/feedback-questions.module';
import { LeadsModule } from './leads/leads.module';
import { AgentAppModule } from './agent-app/agent-app.module';
import { PropertiesModule } from './properties/properties.module';
import { FeedbackSubmissionsModule } from './feedback-submissions/feedback-submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'local'}`, '.env.local'],
    }),
    AgentsModule,
    PropertiesModule,
    OpenHousesModule,
    PublicModule,
    FeedbackQuestionsModule,
    FeedbackSubmissionsModule,
    LeadsModule,
    AgentAppModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
