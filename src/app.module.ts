import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test/test.controller';
import { TestModule } from './test/test.module';
import { TestService } from './test/test.service';
import { AgentsModule } from './agents/agents.module';
import { LeadsModule } from './leads/leads.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [TestModule, AgentsModule, LeadsModule, AuthModule, UsersModule, EmailModule, DatabaseModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
