import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNoteMentionDto } from './create-note-mention.dto';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNoteMentionDto)
  mentions?: CreateNoteMentionDto[];
}
