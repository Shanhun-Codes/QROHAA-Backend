import { Module } from '@nestjs/common';
import { OpenHousesService } from './open-houses.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [],
  providers: [OpenHousesService, PrismaService],
  exports: [OpenHousesService],
})
export class OpenHousesModule {}
