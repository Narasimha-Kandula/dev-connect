import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateReportDto {
  @IsString()
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsString()
  reason!: string;
}

export class ResolveReportDto {
  @IsIn(['reviewed', 'actioned', 'dismissed'])
  status!: 'reviewed' | 'actioned' | 'dismissed';
}

export class SuspendBanDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
