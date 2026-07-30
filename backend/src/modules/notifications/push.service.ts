import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import Redis from 'ioredis';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

interface FcmResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private fcmAvailable = false;
  private apnsAvailable = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  async sendToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      try {
        if (device.platform === 'web' || device.platform === 'android') {
          const result = await this.sendFcm(device.deviceToken, payload);
          if (result.success) sent++;
          else failed++;
        } else if (device.platform === 'ios') {
          await this.sendApns(device.deviceToken, payload);
          sent++;
        }
      } catch (err) {
        failed++;
        this.logger.error(`Push failed for device ${device.id}: ${(err as Error).message}`);
        if (this.isTokenError(err)) {
          await this.prisma.userDevice.update({
            where: { id: device.id },
            data: { isActive: false },
          });
        }
      }
    }

    return { sent, failed };
  }

  async sendToMultipleUsers(userIds: string[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { sent: totalSent, failed: totalFailed };
  }

  private async sendFcm(token: string, payload: PushPayload): Promise<FcmResponse> {
    const serviceAccountKey = this.config.get<string>('firebase.serviceAccountKey');
    if (!serviceAccountKey) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY not configured — skipping FCM');
      return { success: false, error: 'not_configured' };
    }

    try {
      const { google } = await import('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(serviceAccountKey),
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
      const accessToken = await auth.getAccessToken();
      const projectId = this.config.get<string>('firebase.projectId');

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          } as Record<string, string>,
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: payload.data
                ? Object.fromEntries(
                    Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
                  )
                : undefined,
              android: {
                priority: 'high',
                notification: {
                  sound: payload.sound ?? 'default',
                  channelId: 'devconnect_notifications',
                },
              },
              webpush: {
                headers: { Urgency: 'high' },
                notification: {
                  icon: '/favicon.ico',
                  badge: '/badge.png',
                },
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`FCM error (${response.status}): ${body}`);
        return { success: false, error: body };
      }

      const result = await response.json();
      return { success: true, messageId: result.name };
    } catch (err) {
      this.logger.error(`FCM send error: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async sendApns(token: string, payload: PushPayload): Promise<void> {
    const apnsKey = this.config.get<string>('apns.key');
    if (!apnsKey) {
      this.logger.warn('APNs key not configured — skipping APNs');
      return;
    }

    try {
      const jwt = await import('jsonwebtoken');
      const keyId = this.config.get<string>('apns.keyId');
      const teamId = this.config.get<string>('apns.teamId');
      const bundleId = this.config.get<string>('apns.bundleId');

      const now = Math.floor(Date.now() / 1000);
      const apnsToken = jwt.sign({ iss: teamId, iat: now }, apnsKey, {
        header: { alg: 'ES256', kid: keyId },
      });

      const isProduction = this.config.get<string>('nodeEnv') === 'production';
      const host = isProduction ? 'api.push.apple.com' : 'api.development.push.apple.com';

      const response = await fetch(`https://${host}/3/device/${token}`, {
        method: 'POST',
        headers: {
          'authorization': `bearer ${apnsToken}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json',
        } as Record<string, string>,
        body: JSON.stringify({
          aps: {
            alert: { title: payload.title, body: payload.body },
            sound: payload.sound ?? 'default',
            badge: payload.badge ?? 1,
            'content-available': 1,
          },
          data: payload.data ?? {},
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`APNs error (${response.status}): ${body}`);
        if (response.status === 410 || response.status === 400) {
          throw new Error(`Invalid token: ${body}`);
        }
      }
    } catch (err) {
      this.logger.error(`APNs send error: ${(err as Error).message}`);
      throw err;
    }
  }

  private isTokenError(err: unknown): boolean {
    const msg = (err as Error).message.toLowerCase();
    return (
      msg.includes('invalid registration') ||
      msg.includes('not found') ||
      msg.includes('unregistered') ||
      msg.includes('invalid token') ||
      msg.includes('bad device token')
    );
  }
}
