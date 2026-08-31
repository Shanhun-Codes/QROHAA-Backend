import { Module } from '@nestjs/common';
import { OpenHouseService } from './open-house.service';
import { OpenHouseController } from './open-house.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OpenHouseController],
  providers: [OpenHouseService, PrismaService],
})
export class OpenHouseModule {}
