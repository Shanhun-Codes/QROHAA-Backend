import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
