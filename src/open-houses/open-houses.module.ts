import { Module } from '@nestjs/common';
import { OpenHousesService } from './open-houses.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OpenHousePdfService } from './open-house-pdf.service';

@Module({
  controllers: [],
  providers: [OpenHousesService, PrismaService, OpenHousePdfService],
  exports: [OpenHousesService, OpenHousePdfService],
})
export class OpenHousesModule {}
