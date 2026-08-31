import { Test, TestingModule } from '@nestjs/testing';
import { OpenHouseController } from './open-house.controller';
import { OpenHouseService } from './open-house.service';

describe('OpenHouseController', () => {
  let controller: OpenHouseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenHouseController],
      providers: [OpenHouseService],
    }).compile();

    controller = module.get<OpenHouseController>(OpenHouseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
