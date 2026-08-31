import { Test, TestingModule } from '@nestjs/testing';
import { OpenHouseService } from './open-house.service';

describe('OpenHouseService', () => {
  let service: OpenHouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenHouseService],
    }).compile();

    service = module.get<OpenHouseService>(OpenHouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
