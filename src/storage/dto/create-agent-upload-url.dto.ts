import { IsIn, IsString } from 'class-validator';

export class CreateAgentUploadUrlDto {
  @IsIn(['headshot', 'logo'])
  type!: 'headshot' | 'logo';

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}
