import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePropertiesDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  street2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  zip!: string;

  @IsNumber()
  listingPriceCents?: number;
}
