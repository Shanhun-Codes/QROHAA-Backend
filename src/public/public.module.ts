import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicSubmissionProtectionService } from './public-submission-protection.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService, PrismaService, PublicSubmissionProtectionService],
})
export class PublicModule {}
