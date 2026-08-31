import {
  IsEmail,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

const normalizeHexColor = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value && !value.startsWith('#')
    ? `#${value}`
    : value;

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @IsPhoneNumber('US')
  phone!: string;

  @IsOptional()
  @IsString()
  brokerageName?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  headshotUrl?: string;

  @IsOptional()
  @Transform(normalizeHexColor)
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @Transform(normalizeHexColor)
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @Transform(normalizeHexColor)
  @IsHexColor()
  accentColor?: string;
}
