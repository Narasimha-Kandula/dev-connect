import { IsString, IsOptional } from 'class-validator';

export class EndorseDto {
  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
