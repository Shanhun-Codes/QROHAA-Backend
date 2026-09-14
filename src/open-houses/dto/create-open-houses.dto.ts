import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateOpenHousesDto {
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
