import { IsString, IsOptional, IsArray, ValidateNested, MaxLength, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class AttachmentDto {
  @IsString()
  url!: string;

  @IsString()
  type!: string;

  @IsString()
  name!: string;
}

export class CreateConversationDto {
  @IsUUID()
  targetUserId!: string;
}

export class CreateGroupDto {
  @IsString()
  name!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  memberIds!: string[];
}

export class EditMessageDto {
  @IsString()
  @MaxLength(10000)
  content!: string;
}

export class ReactionDto {
  @IsString()
  emoji!: string;
}
