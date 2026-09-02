import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OpenHouseService } from './open-house.service';
import { CreateOpenHouseDto } from './dto/create-open-house.dto';
import { UpdateOpenHouseDto } from './dto/update-open-house.dto';

@Controller('open-house')
export class OpenHouseController {
  constructor(private readonly openHouseService: OpenHouseService) {}

  @Post()
  create(@Body() createOpenHouseDto: CreateOpenHouseDto) {
    return this.openHouseService.create(createOpenHouseDto);
  }

  @Get()
  findAll() {
    return this.openHouseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.openHouseService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOpenHouseDto: UpdateOpenHouseDto,
  ) {
    return this.openHouseService.update(+id, updateOpenHouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.openHouseService.remove(+id);
  }
}
