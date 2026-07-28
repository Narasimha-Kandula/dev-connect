import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SetupMfaDto {
  @IsOptional()
  @IsString()
  token?: string;
}

export class VerifyMfaDto {
  @IsString()
  token!: string;
}

export class EnableMfaDto {
  @IsString()
  secret!: string;

  @IsString()
  token!: string;
}
