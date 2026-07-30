import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevicesService } from '../../src/modules/devices/devices.service';
import { PushService } from '../../src/modules/notifications/push.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Push Notifications Integration', () => {
  let devicesService: DevicesService;
  let pushService: PushService;
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        DevicesService,
        PushService,
        {
          provide: PrismaService,
          useValue: {
            userDevice: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              upsert: jest.fn(),
              updateMany: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            notification: {
              create: jest.fn(),
            },
            notificationPreference: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: { get: jest.fn(), setex: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'firebase.serviceAccountKey') return undefined;
              if (key === 'apns.key') return undefined;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    devicesService = moduleRef.get<DevicesService>(DevicesService);
    pushService = moduleRef.get<PushService>(PushService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('Device Registration', () => {
    it('should register a new device', async () => {
      const upsertMock = prisma.userDevice.upsert as jest.Mock;
      upsertMock.mockResolvedValue({
        id: 'device-1',
        userId: 'user-1',
        deviceToken: 'fcm-token-123',
        platform: 'android',
        isActive: true,
        lastActiveAt: new Date(),
      });

      const result = await devicesService.register('user-1', 'fcm-token-123', 'android', 'OnePlus 12', 'Mozilla/5.0');

      expect(result.deviceToken).toBe('fcm-token-123');
      expect(result.platform).toBe('android');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_deviceToken_platform: { userId: 'user-1', deviceToken: 'fcm-token-123', platform: 'android' } },
          update: expect.objectContaining({ isActive: true }),
          create: expect.objectContaining({ userId: 'user-1', deviceToken: 'fcm-token-123', platform: 'android' }),
        }),
      );
    });

    it('should unregister a device', async () => {
      (prisma.userDevice.findMany as jest.Mock).mockResolvedValue([
        { id: 'device-1', userId: 'user-1', deviceToken: 'fcm-token-123' },
      ]);

      const result = await devicesService.unregister('user-1', 'fcm-token-123');

      expect(result.success).toBe(true);
      expect(prisma.userDevice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', deviceToken: 'fcm-token-123' },
          data: { isActive: false, lastActiveAt: expect.any(Date) },
        }),
      );
    });

    it('should return device_not_found for unknown device', async () => {
      (prisma.userDevice.findMany as jest.Mock).mockResolvedValue([]);

      const result = await devicesService.unregister('user-1', 'unknown-token');

      expect(result).toEqual({ success: false, reason: 'device_not_found' });
    });

    it('should return active device tokens for a user', async () => {
      (prisma.userDevice.findMany as jest.Mock).mockResolvedValue([
        { deviceToken: 'token-1', platform: 'android' },
        { deviceToken: 'token-2', platform: 'ios' },
      ]);

      const tokens = await devicesService.getUserActiveDeviceTokens('user-1');

      expect(tokens).toEqual(['token-1', 'token-2']);
    });
  });

  describe('Push Service', () => {
    it('should skip push when no active devices exist', async () => {
      (prisma.userDevice.findMany as jest.Mock).mockResolvedValue([]);

      const result = await pushService.sendToUser('user-1', {
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
    });

    it('should warn when FCM is not configured', async () => {
      (prisma.userDevice.findMany as jest.Mock).mockResolvedValue([
        { id: 'device-1', userId: 'user-1', deviceToken: 'fcm-token', platform: 'android', isActive: true },
      ]);

      const result = await pushService.sendToUser('user-1', {
        title: 'Test',
        body: 'Body',
        data: { type: 'MATCH' },
      });

      expect(result.sent).toBe(0);
    });
  });
});
