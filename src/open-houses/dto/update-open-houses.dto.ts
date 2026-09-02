import { PartialType } from '@nestjs/mapped-types';
import { CreateOpenHousesDto } from './create-open-houses.dto';

export class UpdateOpenHouseDto extends PartialType(CreateOpenHousesDto) {}
