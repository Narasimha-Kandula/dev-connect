import { IsEnum, IsBoolean } from 'class-validator';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class SetPreferenceDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsBoolean()
  enabled!: boolean;
}
