import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateOpenHouseDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsDateString()
  @IsNotEmpty()
  startsAt!: Date;

  @IsDateString()
  @IsNotEmpty()
  endsAt!: Date;
}
