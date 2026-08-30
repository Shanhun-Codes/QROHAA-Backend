import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

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

  @IsString()
  brokerageName?: string;

  @IsString()
  headline?: string;

  @IsString()
  logoUrl?: string;

  @IsString()
  headshotUrl?: string;

  @IsString()
  primaryColor?: string;

  @IsString()
  secondaryColor?: string;
}
