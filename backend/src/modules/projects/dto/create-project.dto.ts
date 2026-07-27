import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString() @MaxLength(120)
  title!: string;

  @IsOptional() @IsString() @MaxLength(4000)
  description?: string;

  @IsOptional() @IsArray()
  requiredSkills?: string[];

  @IsOptional() @IsString()
  budget?: string;

  @IsOptional() @IsString()
  timeline?: string;
}
