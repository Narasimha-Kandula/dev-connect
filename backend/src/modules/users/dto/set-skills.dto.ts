import { IsArray, ValidateNested, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SkillEntryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  proficiency?: number;
}

export class SetSkillsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillEntryDto)
  skills!: SkillEntryDto[];
}
