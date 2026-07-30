import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async register(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    deviceName?: string,
    userAgent?: string,
  ) {
    const device = await this.prisma.userDevice.upsert({
      where: {
        userId_deviceToken_platform: { userId, deviceToken, platform },
      },
      update: {
        isActive: true,
        deviceName: deviceName ?? undefined,
        userAgent: userAgent ?? undefined,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        deviceToken,
        platform,
        deviceName,
        userAgent,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    this.logger.log(`Device registered: ${platform} token for user ${userId}`);
    return device;
  }

  async unregister(userId: string, deviceToken: string, platform?: string) {
    const where: any = { userId, deviceToken };
    if (platform) where.platform = platform;

    const devices = await this.prisma.userDevice.findMany({ where });

    if (devices.length === 0) {
      this.logger.warn(`Device not found for user ${userId}, token: ${deviceToken?.slice(0, 8)}...`);
      return { success: false, reason: 'device_not_found' };
    }

    await this.prisma.userDevice.updateMany({
      where,
      data: { isActive: false, lastActiveAt: new Date() },
    });

    this.logger.log(`Device unregistered for user ${userId}`);
    return { success: true };
  }

  async getUserDevices(userId: string, activeOnly = true) {
    return this.prisma.userDevice.findMany({
      where: { userId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async getUserActiveDeviceTokens(userId: string): Promise<string[]> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: { deviceToken: true, platform: true },
    });
    return devices.map((d) => d.deviceToken);
  }
}
