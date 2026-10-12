import { IsString, IsNotEmpty } from 'class-validator';
export class CompleteAgencyLogoDto {
  @IsString()
  @IsNotEmpty()
  key!: string;
}
