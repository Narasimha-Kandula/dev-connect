import { Injectable, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class SwipeLimitsService {
  private readonly logger = new Logger(SwipeLimitsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  getDailyLimit(planTier: string): number {
    switch (planTier) {
      case 'FREE':
        return this.config.get<number>('swipeLimits.free') ?? 20;
      case 'PRO':
        return this.config.get<number>('swipeLimits.pro') ?? 100;
      case 'ENTERPRISE':
        return Infinity;
      default:
        return 20;
    }
  }

  private todayKey(userId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `swipe:limit:${userId}:${today}`;
  }

  async getRemainingSwipes(userId: string, planTier: string): Promise<{ limit: number; used: number; remaining: number }> {
    const limit = this.getDailyLimit(planTier);
    if (!isFinite(limit)) {
      return { limit: Infinity, used: 0, remaining: Infinity };
    }

    let used = 0;
    if (this.redis) {
      try {
        const cached = await this.redis.get(this.todayKey(userId));
        if (cached !== null) {
          used = parseInt(cached, 10);
          return { limit, used, remaining: Math.max(0, limit - used) };
        }
      } catch { /* Redis miss - fall through to DB */ }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const record = await this.prisma.swipeLimit.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    });

    used = record?.swipeCount ?? 0;

    if (this.redis) {
      this.redis.setex(this.todayKey(userId), 60, String(used)).catch(() => {});
    }

    return { limit, used, remaining: Math.max(0, limit - used) };
  }

  async incrementSwipeCount(userId: string, planTier: string): Promise<void> {
    const { remaining } = await this.getRemainingSwipes(userId, planTier);
    if (remaining <= 0) {
      const limit = this.getDailyLimit(planTier);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily swipe limit reached (${limit}). Upgrade to PRO for more swipes.`,
          limit,
          planTier,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    await this.prisma.swipeLimit.upsert({
      where: { userId_date: { userId, date: todayStart } },
      update: { swipeCount: { increment: 1 } },
      create: { userId, date: todayStart, swipeCount: 1 },
    });

    if (this.redis) {
      const key = this.todayKey(userId);
      this.redis.incr(key).catch(() => {});
      this.redis.expire(key, 120).catch(() => {});
    }
  }

  async getUsageHistory(userId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.swipeLimit.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'desc' },
    });
  }
}
