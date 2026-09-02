import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertiesDto } from './create-properties.dto';

export class UpdatePropertiesDto extends PartialType(CreatePropertiesDto) {}
