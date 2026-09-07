import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NoteEntityType } from '../../../generated/prisma/client';

export class CreateNoteMentionDto {
  @IsEnum(NoteEntityType)
  targetType!: NoteEntityType;

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}
