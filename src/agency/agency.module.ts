import { AgencySettingsService } from './agency-settings.service';
import { StorageModule } from 'src/storage/storage.module';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { InvitationEmailService } from './invitation-email.service';
@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [AgencyController],
  providers: [AgencyService, InvitationEmailService, AgencySettingsService],
})
export class AgencyModule {}
