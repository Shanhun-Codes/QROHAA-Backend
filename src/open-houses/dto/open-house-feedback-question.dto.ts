import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class OpenHouseFeedbackQuestionDto {
  @IsString()
  questionId!: string;

  @IsBoolean()
  required!: boolean;

  @IsInt()
  sortOrder!: number;

  @IsBoolean()
  printable!: boolean;

  @IsOptional()
  @IsInt()
  printableSortOrder?: number | null;
}
