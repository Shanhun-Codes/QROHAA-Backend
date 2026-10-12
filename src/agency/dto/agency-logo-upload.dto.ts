import { IsIn } from 'class-validator';
export class AgencyLogoUploadDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}
