import { FraudDetectionService } from '../../src/modules/fraud/fraud-detection.service';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'fraud.swipeThreshold') return 50;
        if (key === 'fraud.requestThreshold') return 200;
        if (key === 'fraud.minProfileCompleteness') return 20;
        return undefined;
      }),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
      },
      swipe: {
        findMany: jest.fn(),
      },
      fraudFlag: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new FraudDetectionService(mockPrisma as any, mockConfig as any, mockRedis);
  });

  describe('scoreUser', () => {
    it('should return low score for legitimate user', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'legitimate@example.com',
        createdAt: twoDaysAgo,
        _count: { sessions: 3 },
      });
      mockPrisma.profile.findUnique.mockResolvedValue({
        userId: 'user-1',
        profileCompleteness: 80,
      });
      mockPrisma.swipe.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          createdAt: new Date(Date.now() - i * 60000),
        })),
      );
      mockPrisma.fraudFlag.findUnique.mockResolvedValue(null);

      const result = await service.scoreUser('user-1');

      expect(result.riskScore).toBeLessThan(20);
      expect(result.action).toBe('none');
    });

    it('should flag rapid swiping behavior', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'suspicious@tempmail.com',
        createdAt: new Date(),
        _count: { sessions: 1 },
      });
      mockPrisma.profile.findUnique.mockResolvedValue({
        userId: 'user-2',
        profileCompleteness: 10,
      });
      mockPrisma.swipe.findMany.mockResolvedValue(
        Array.from({ length: 60 }, (_, i) => ({
          createdAt: new Date(Date.now() - i * 100),
        })),
      );
      mockPrisma.fraudFlag.findUnique.mockResolvedValue(null);

      const result = await service.scoreUser('user-2');

      expect(result.riskScore).toBeGreaterThanOrEqual(20);
      expect(result.signals.rapidSwiping).toBe(true);
      expect(result.signals.lowProfileCompletion).toBe(true);
      expect(result.signals.emailDomainSuspicious).toBe(true);
      expect(result.signals.accountAgeTooYoung).toBe(true);
      expect(result.flags.length).toBeGreaterThanOrEqual(1);
    });

    it('should soft ban for high risk scores (70-89)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        email: 'spam@mailinator.com',
        createdAt: new Date(),
        _count: { sessions: 0 },
      });
      mockPrisma.profile.findUnique.mockResolvedValue({
        userId: 'user-3',
        profileCompleteness: 0,
      });
      mockPrisma.swipe.findMany.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          createdAt: new Date(Date.now() - i * 50),
        })),
      );
      mockPrisma.fraudFlag.findUnique.mockResolvedValue(null);

      const result = await service.scoreUser('user-3');

      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.action).toBe('soft_ban');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-3' },
          data: { isSuspended: true },
        }),
      );
    });

    it('should enforce hard ban for very high risk scores (90+)', async () => {
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key === 'rate:user-4') return '300';
        return null;
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-4',
        email: 'spam@mailinator.com',
        createdAt: new Date(),
        _count: { sessions: 0 },
      });
      mockPrisma.profile.findUnique.mockResolvedValue({
        userId: 'user-4',
        profileCompleteness: 0,
      });
      mockPrisma.swipe.findMany.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          createdAt: new Date(Date.now() - i * 50),
        })),
      );
      mockPrisma.fraudFlag.findUnique.mockResolvedValue(null);

      const result = await service.scoreUser('user-4');

      expect(result.riskScore).toBeGreaterThanOrEqual(90);
      expect(result.action).toBe('hard_ban');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-4' },
          data: { isBanned: true },
        }),
      );
    });
  });

  describe('checkActionRequired', () => {
    it('should return null when no flags are active', async () => {
      mockPrisma.fraudFlag.findUnique.mockResolvedValue(null);

      const result = await service.checkActionRequired('user-1');
      expect(result).toBeNull();
    });

    it('should return null when flags are resolved', async () => {
      mockPrisma.fraudFlag.findUnique.mockResolvedValue({
        userId: 'user-1',
        riskScore: 0,
        signals: {},
        flags: ['resolved'],
        isActive: false,
      });

      const result = await service.checkActionRequired('user-1');
      expect(result).toBeNull();
    });
  });

  describe('resolveFlags', () => {
    it('should clear fraud flags for a user', async () => {
      mockPrisma.fraudFlag.update.mockResolvedValue({ success: true });

      const result = await service.resolveFlags('user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.fraudFlag.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });
});
