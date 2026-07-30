import { IsString, IsIn, IsOptional } from 'class-validator';

export class OAuthDto {
  @IsString()
  code!: string;

  @IsString()
  @IsIn(['github', 'google'])
  provider!: 'github' | 'google';

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}
