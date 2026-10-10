import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertiesService } from './properties.service';

@Module({
  controllers: [],
  providers: [PropertiesService, PrismaService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
