import { Module } from '@nestjs/common';
import { OpenHouseService } from './open-house.service';
import { OpenHouseController } from './open-house.controller';

@Module({
  controllers: [OpenHouseController],
  providers: [OpenHouseService],
})
export class OpenHouseModule {}
