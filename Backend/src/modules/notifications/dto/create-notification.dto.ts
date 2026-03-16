import { IsString, IsEnum, IsOptional } from 'class-validator';
import { NotificationType, NotificationTarget } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationTarget)
  targetType: NotificationTarget;

  @IsString()
  @IsOptional()
  targetId?: string;
}
