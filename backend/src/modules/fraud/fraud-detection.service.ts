import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import Redis from 'ioredis';

export interface FraudSignals {
  rapidSwiping: boolean;
  highRequestRate: boolean;
  lowProfileCompletion: boolean;
  duplicateIp: boolean;
  duplicateDevice: boolean;
  emailDomainSuspicious: boolean;
  accountAgeTooYoung: boolean;
}

export interface FraudScoreResult {
  userId: string;
  riskScore: number;
  signals: FraudSignals;
  flags: string[];
  action: 'none' | 'flag' | 'captcha' | 'soft_ban' | 'hard_ban';
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  async scoreUser(userId: string): Promise<FraudScoreResult> {
    const [user, profile, recentSwipes, fraudFlag] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { _count: { select: { sessions: true } } },
      }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.swipe.findMany({
        where: { sourceId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.fraudFlag.findUnique({ where: { userId } }),
    ]);

    if (!user) {
      return {
        userId,
        riskScore: 0,
        signals: {
          rapidSwiping: false,
          highRequestRate: false,
          lowProfileCompletion: false,
          duplicateIp: false,
          duplicateDevice: false,
          emailDomainSuspicious: false,
          accountAgeTooYoung: false,
        },
        flags: [],
        action: 'none',
      };
    }

    const signals = await this.evaluateSignals(user, profile, recentSwipes);

    const score = this.calculateRiskScore(signals);
    const flags = this.determineFlags(signals, score, fraudFlag?.flags as string[] ?? []);
    const action = this.determineAction(score, flags);

    if (fraudFlag) {
      await this.prisma.fraudFlag.update({
        where: { userId },
        data: {
          riskScore: score,
          signals: signals as never,
          flags: flags as never,
          isActive: action !== 'none',
        },
      });
    } else {
      await this.prisma.fraudFlag.create({
        data: {
          userId,
          riskScore: score,
          signals: signals as never,
          flags: flags as never,
          isActive: action !== 'none',
        },
      });
    }

    if (action === 'hard_ban') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });
      this.logger.warn(`User ${userId} HARD BANNED (score: ${score})`);
    } else if (action === 'soft_ban') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true },
      });
      this.logger.warn(`User ${userId} SOFT BANNED (score: ${score})`);
    }

    return { userId, riskScore: score, signals, flags, action };
  }

  private async evaluateSignals(
    user: any,
    profile: any,
    recentSwipes: any[],
  ): Promise<FraudSignals> {
    const rapidSwiping = this.detectRapidSwiping(recentSwipes);
    const lowProfileCompletion = profile
      ? (profile.profileCompleteness ?? 0) < (this.config.get<number>('fraud.minProfileCompleteness') ?? 20)
      : true;

    const emailDomainSuspicious = this.isSuspiciousEmailDomain(user.email);

    const accountAgeTooYoung =
      Date.now() - new Date(user.createdAt).getTime() < 10 * 60 * 1000;

    let highRequestRate = false;
    if (this.redis) {
      try {
        const requestCount = await this.redis.get(`rate:${user.id}`);
        if (requestCount && parseInt(requestCount, 10) > (this.config.get<number>('fraud.requestThreshold') ?? 200)) {
          highRequestRate = true;
        }
      } catch { /* Redis unavailable - skip rate check */ }
    }

    return {
      rapidSwiping,
      highRequestRate,
      lowProfileCompletion,
      duplicateIp: false,
      duplicateDevice: false,
      emailDomainSuspicious,
      accountAgeTooYoung,
    };
  }

  private detectRapidSwiping(swipes: any[]): boolean {
    if (swipes.length < 10) return false;
    const threshold = this.config.get<number>('fraud.swipeThreshold') ?? 50;
    if (swipes.length >= threshold) return true;

    const timestamps = swipes.map((s) => new Date(s.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i - 1] - timestamps[i] < 500) return true;
    }
    return false;
  }

  private isSuspiciousEmailDomain(email: string): boolean {
    const suspiciousDomains = [
      'tempmail', 'throwaway', 'mailinator', 'guerrillamail',
      'sharklasers', 'trashmail', '10minutemail', 'yopmail',
    ];
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    return suspiciousDomains.some((d) => domain.includes(d));
  }

  private calculateRiskScore(signals: FraudSignals): number {
    const weights: Record<keyof FraudSignals, number> = {
      rapidSwiping: 25,
      highRequestRate: 20,
      lowProfileCompletion: 15,
      duplicateIp: 20,
      duplicateDevice: 15,
      emailDomainSuspicious: 30,
      accountAgeTooYoung: 10,
    };

    let score = 0;
    for (const [signal, detected] of Object.entries(signals)) {
      if (detected) score += weights[signal as keyof FraudSignals];
    }

    return Math.min(score, 100);
  }

  private determineFlags(signals: FraudSignals, score: number, existingFlags: string[]): string[] {
    const flags = new Set(existingFlags.filter((f) => f !== 'resolved'));

    if (score >= 20) flags.add('flagged_for_review');
    if (score >= 40) flags.add('temp_restricted');
    if (signals.lowProfileCompletion && score >= 30) flags.add('captcha_triggered');
    if (score >= 70) flags.add('soft_banned');
    if (score >= 90) flags.add('hard_banned');

    return Array.from(flags);
  }

  private determineAction(score: number, flags: string[]): 'none' | 'flag' | 'captcha' | 'soft_ban' | 'hard_ban' {
    if (flags.includes('hard_banned')) return 'hard_ban';
    if (flags.includes('soft_banned')) return 'soft_ban';
    if (flags.includes('captcha_triggered')) return 'captcha';
    if (flags.includes('flagged_for_review')) return 'flag';
    return 'none';
  }

  async checkActionRequired(userId: string): Promise<FraudScoreResult | null> {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { userId } });
    if (!flag || !flag.isActive) return null;

    const action = this.determineAction(flag.riskScore, flag.flags as string[] ?? []);
    if (action === 'none') return null;

    return {
      userId,
      riskScore: flag.riskScore,
      signals: (flag.signals ?? {}) as unknown as FraudSignals,
      flags: (flag.flags ?? []) as string[],
      action,
    };
  }

  async resolveFlags(userId: string) {
    await this.prisma.fraudFlag.update({
      where: { userId },
      data: { isActive: false, riskScore: 0, flags: ['resolved'] as never },
    });
    return { success: true };
  }
}
