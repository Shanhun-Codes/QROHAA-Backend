import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateOpenHouseDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsDate()
  @IsNotEmpty()
  startsAt!: Date;

  @IsDate()
  @IsNotEmpty()
  endsAt!: Date;
}

