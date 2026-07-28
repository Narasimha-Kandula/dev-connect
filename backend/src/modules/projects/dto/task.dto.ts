import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class UpdateTaskStatusDto {
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status!: string;
}

export class RespondToInvitationDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  action!: 'ACCEPTED' | 'REJECTED';
}
