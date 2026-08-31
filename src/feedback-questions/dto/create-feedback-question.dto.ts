import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FeedbackQuestionCategory, FeedbackQuestionType } from 'generated/prisma/enums';

class FeedbackQuestionOptionDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsInt()
  sortOrder!: number;
}

export class CreateFeedbackQuestionDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsEnum(FeedbackQuestionType)
  type!: FeedbackQuestionType;

  @IsOptional()
  @IsEnum(FeedbackQuestionCategory)
  category?: FeedbackQuestionCategory;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedbackQuestionOptionDto)
  options?: FeedbackQuestionOptionDto[];
}
