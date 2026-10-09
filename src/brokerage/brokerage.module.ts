import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BrokerageService } from './brokerage.service';

@Module({
  providers: [BrokerageService, PrismaService],
  exports: [BrokerageService],
})
export class BrokerageModule {}
