import { IsIn, IsString } from 'class-validator';

export class CompleteAgentUploadDto {
  @IsIn(['headshot', 'logo'])
  type!: 'headshot' | 'logo';

  @IsString()
  key!: string;
}
