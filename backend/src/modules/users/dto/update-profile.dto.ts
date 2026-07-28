import { IsArray, IsIn, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(80)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(120)
  headline?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  bio?: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsString()
  githubUsername?: string;

  @IsOptional() @IsArray()
  portfolioLinks?: { label: string; url: string }[];

  @IsOptional()
  @IsIn(['OPEN_TO_WORK', 'HIRING', 'OPEN_TO_COLLAB', 'NOT_AVAILABLE'])
  availability?: string;

  @IsOptional() @IsObject()
  preferences?: Record<string, unknown>;
}
