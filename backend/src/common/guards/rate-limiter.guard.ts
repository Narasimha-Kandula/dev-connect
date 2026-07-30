import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

export interface RateLimitConfig {
  points: number;   // max requests
  duration: number; // window in seconds
}

export const RATE_LIMIT_KEY = 'rate_limit';

export function RateLimit(points: number, duration: number): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, { points, duration }, descriptor?.value ?? target);
  };
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis | null,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!config) return true;
    if (!this.redis) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id ?? request.ip ?? 'anonymous';
    const key = `ratelimit:${context.getClass().name}:${context.getHandler().name}:${userId}`;
    const now = Date.now();
    const window = config.duration * 1000;

    try {
      const multi = this.redis.multi();
      multi.zremrangebyscore(key, 0, now - window);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, config.duration);

      const results = await multi.exec();
      const count = results?.[2]?.[1] as number ?? 0;

      if (count > config.points) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch {
      // Redis unavailable — allow request through
    }
    return true;
  }
}
