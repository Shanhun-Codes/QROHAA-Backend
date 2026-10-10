import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { PropertyStatusType } from 'generated/prisma/enums';

import { CreatePropertiesDto } from './create-properties.dto';

export class UpdatePropertiesDto extends PartialType(CreatePropertiesDto) {
  @IsOptional()
  @IsEnum(PropertyStatusType)
  status?: PropertyStatusType;
}
