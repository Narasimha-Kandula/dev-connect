import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SwipeLimitsService } from '../../src/modules/swipe-limits/swipe-limits.service';
import { SwipeLimitGuard } from '../../src/modules/swipe-limits/swipe-limit.guard';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Swipe Limits Integration', () => {
  let swipeLimitsService: SwipeLimitsService;
  let swipeLimitGuard: SwipeLimitGuard;
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        SwipeLimitsService,
        SwipeLimitGuard,
        {
          provide: PrismaService,
          useValue: {
            swipeLimit: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            setex: jest.fn().mockResolvedValue('OK'),
            incr: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    swipeLimitsService = moduleRef.get<SwipeLimitsService>(SwipeLimitsService);
    swipeLimitGuard = moduleRef.get<SwipeLimitGuard>(SwipeLimitGuard);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('SwipeLimitGuard', () => {
    it('should allow request when under limit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        planTier: 'FREE',
      });
      (prisma.swipeLimit.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        swipeCount: 5,
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-1' } }),
        }),
      } as any;

      const result = await swipeLimitGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should block request when limit exceeded', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-2',
        planTier: 'FREE',
      });
      (prisma.swipeLimit.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-2',
        swipeCount: 20,
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-2' } }),
        }),
      } as any;

      await expect(swipeLimitGuard.canActivate(mockContext)).rejects.toThrow();
    });

    it('should always allow ENTERPRISE users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-3',
        planTier: 'ENTERPRISE',
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-3' } }),
        }),
      } as any;

      const result = await swipeLimitGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('SwipeLimitsService', () => {
    it('should enforce FREE tier limit of 20', async () => {
      expect(swipeLimitsService.getDailyLimit('FREE')).toBe(20);
    });

    it('should enforce PRO tier limit of 100', async () => {
      expect(swipeLimitsService.getDailyLimit('PRO')).toBe(100);
    });

    it('should give unlimited to ENTERPRISE', async () => {
      expect(swipeLimitsService.getDailyLimit('ENTERPRISE')).toBe(Infinity);
    });

    it('should throw 429 when FREE user exceeds 20 swipes', async () => {
      jest.spyOn(swipeLimitsService, 'getRemainingSwipes').mockResolvedValue({ limit: 20, used: 20, remaining: 0 });

      await expect(
        swipeLimitsService.incrementSwipeCount('user-1', 'FREE'),
      ).rejects.toMatchObject({
        status: 429,
      });
    });
  });
});
