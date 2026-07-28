import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private failureCount = 0;
  private readonly maxFailures = 5;
  private isCircuitOpen = false;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');

    const separator = url.includes('?') ? '&' : '?';
    const poolUrl = `${url}${separator}pool_timeout=15&statement_cache_size=0`;

    super({
      datasources: { db: { url: poolUrl } },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.connectWithRetry(5);
    this.startHeartbeat();
  }

  private async connectWithRetry(maxAttempts: number): Promise<void> {
    let lastError: Error | null = null;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        this.failureCount = 0;
        this.isCircuitOpen = false;
        return;
      } catch (e) {
        lastError = e as Error;
        const delay = Math.min(1000 * Math.pow(2, i) + Math.random() * 500, 8000);
        this.logger.warn(
          `Connection attempt ${i + 1}/${maxAttempts} failed: ${(e as Error).message}. Retrying in ${Math.round(delay)}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    this.logger.error(`Failed to connect after ${maxAttempts} attempts`);
    throw lastError;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.isCircuitOpen) {
        await this.attemptCircuitReset();
        return;
      }
      try {
        await this.$queryRaw`SELECT 1`;
        this.failureCount = 0;
      } catch (e) {
        this.failureCount++;
        this.logger.warn(
          `Heartbeat #${this.failureCount} failed: ${(e as Error).message}`,
        );
        if (this.failureCount >= this.maxFailures) {
          this.isCircuitOpen = true;
          this.logger.error('Circuit breaker OPEN — too many heartbeat failures');
        }
      }
    }, 30_000);
  }

  private async attemptCircuitReset(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Attempting circuit reset — reconnecting...');
      for (let i = 0; i < 3; i++) {
        try {
          await this.$connect();
          this.failureCount = 0;
          this.isCircuitOpen = false;
          this.logger.log('Circuit breaker RESET — database reconnected');
          return;
        } catch (e) {
          const delay = Math.min(2000 * Math.pow(2, i) + Math.random() * 500, 8000);
          this.logger.warn(
            `Reset attempt ${i + 1}/3 failed: ${(e as Error).message}. Retry in ${Math.round(delay)}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      this.logger.error('Circuit breaker — database remains unreachable after reset');
    } catch {
      // ignore disconnect errors
    }
  }

  async onModuleDestroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
