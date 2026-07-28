import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(userId: string, type: NotificationType, title: string, body?: string, metadata?: object) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_channel_type: { userId, channel: 'IN_APP', type } },
    });
    if (pref && !pref.enabled) return null;

    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, metadata, channel: 'IN_APP' },
    });

    const emailPref = await this.prisma.notificationPreference.findUnique({
      where: { userId_channel_type: { userId, channel: 'EMAIL', type } },
    });
    if (!emailPref || emailPref.enabled) {
      this.sendEmailSafe(userId, type, title, body).catch(() => {});
    }

    return notification;
  }

  list(userId: string, limit = 50, offset = 0) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { userId } });
  }

  async setPreference(userId: string, type: NotificationType, channel: NotificationChannel, enabled: boolean) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_channel_type: { userId, channel, type } },
      update: { enabled },
      create: { userId, channel, type, enabled },
    });
  }

  private async sendEmailSafe(userId: string, type: NotificationType, title: string, body?: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.email) return;

      const { Resend } = await import('resend');
      const resend = new Resend(this.config.get('resend.apiKey'));
      await resend.emails.send({
        from: this.config.get<string>('resend.emailFrom')!,
        to: user.email,
        subject: `DevConnect: ${title}`,
        html: `<p>${body ?? title}</p><p style="color:#888">— DevConnect Team</p>`,
      });
    } catch (e) {
      this.logger.error(`Email send failed for user ${userId}: ${(e as Error).message}`);
    }
  }
}
