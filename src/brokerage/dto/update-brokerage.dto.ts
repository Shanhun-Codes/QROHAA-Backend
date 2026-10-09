import { PartialType } from '@nestjs/swagger';
import { CreateBrokerageDto } from './create-brokerage.dto';

export class UpdateBrokerageDto extends PartialType(CreateBrokerageDto) {}
