import { SwipeLimitsService } from '../../src/modules/swipe-limits/swipe-limits.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SwipeLimitsService', () => {
  let service: SwipeLimitsService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'swipeLimits.free') return 20;
        if (key === 'swipeLimits.pro') return 100;
        return undefined;
      }),
    };

    mockPrisma = {
      swipeLimit: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new SwipeLimitsService(mockPrisma as any, mockConfig as any, mockRedis);
  });

  describe('getDailyLimit', () => {
    it('should return free limit for FREE plan', () => {
      expect(service.getDailyLimit('FREE')).toBe(20);
    });

    it('should return pro limit for PRO plan', () => {
      expect(service.getDailyLimit('PRO')).toBe(100);
    });

    it('should return Infinity for ENTERPRISE plan', () => {
      expect(service.getDailyLimit('ENTERPRISE')).toBe(Infinity);
    });

    it('should default to free limit for unknown plans', () => {
      expect(service.getDailyLimit('UNKNOWN')).toBe(20);
    });
  });

  describe('getRemainingSwipes', () => {
    it('should return full limit when no swipes used', async () => {
      mockPrisma.swipeLimit.findUnique.mockResolvedValue(null);

      const result = await service.getRemainingSwipes('user-1', 'FREE');

      expect(result).toEqual({ limit: 20, used: 0, remaining: 20 });
    });

    it('should return remaining count when swipes used', async () => {
      mockPrisma.swipeLimit.findUnique.mockResolvedValue({ swipeCount: 5 });

      const result = await service.getRemainingSwipes('user-1', 'FREE');

      expect(result).toEqual({ limit: 20, used: 5, remaining: 15 });
    });

    it('should use Redis cache when available', async () => {
      mockRedis.get.mockResolvedValue('3');

      const result = await service.getRemainingSwipes('user-1', 'FREE');

      expect(result).toEqual({ limit: 20, used: 3, remaining: 17 });
      expect(mockPrisma.swipeLimit.findUnique).not.toHaveBeenCalled();
    });

    it('should return unlimited for ENTERPRISE', async () => {
      const result = await service.getRemainingSwipes('user-1', 'ENTERPRISE');

      expect(result).toEqual({ limit: Infinity, used: 0, remaining: Infinity });
    });
  });

  describe('incrementSwipeCount', () => {
    it('should throw when limit exceeded', async () => {
      mockPrisma.swipeLimit.findUnique.mockResolvedValue({ swipeCount: 20 });

      await expect(service.incrementSwipeCount('user-1', 'FREE')).rejects.toThrow(HttpException);
      await expect(service.incrementSwipeCount('user-1', 'FREE')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('should upsert swipe limit record on swipe', async () => {
      mockPrisma.swipeLimit.findUnique.mockResolvedValue({ swipeCount: 0 });

      await service.incrementSwipeCount('user-1', 'FREE');

      expect(mockPrisma.swipeLimit.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId_date: expect.objectContaining({ userId: 'user-1' }) }),
          update: { swipeCount: { increment: 1 } },
          create: expect.objectContaining({ userId: 'user-1', swipeCount: 1 }),
        }),
      );
    });
  });

  describe('getUsageHistory', () => {
    it('should return swipe history for last N days', async () => {
      mockPrisma.swipeLimit.findMany.mockResolvedValue([
        { userId: 'user-1', date: new Date(), swipeCount: 5 },
      ]);

      const result = await service.getUsageHistory('user-1', 7);

      expect(result).toHaveLength(1);
      expect(mockPrisma.swipeLimit.findMany).toHaveBeenCalled();
    });
  });
});
