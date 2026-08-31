import { PartialType } from '@nestjs/mapped-types';
import { CreateOpenHouseDto } from './create-open-house.dto';

export class UpdateOpenHouseDto extends PartialType(CreateOpenHouseDto) {}
