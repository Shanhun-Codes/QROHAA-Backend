import { Injectable } from '@nestjs/common';
import { CreateOpenHouseDto } from './dto/create-open-house.dto';
import { UpdateOpenHouseDto } from './dto/update-open-house.dto';

@Injectable()
export class OpenHouseService {
  create(createOpenHouseDto: CreateOpenHouseDto) {
    return 'This action adds a new openHouse';
  }

  findAll() {
    return `This action returns all openHouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} openHouse`;
  }

  update(id: number, updateOpenHouseDto: UpdateOpenHouseDto) {
    return `This action updates a #${id} openHouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} openHouse`;
  }
}
