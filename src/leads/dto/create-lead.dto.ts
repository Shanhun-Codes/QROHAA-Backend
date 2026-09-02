import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsOptional()
  firstName?: string | null;

  @IsString()
  @IsOptional()
  lastName?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsPhoneNumber('US')
  phone?: string | null;

  @IsString()
  agentId!: string;
}
