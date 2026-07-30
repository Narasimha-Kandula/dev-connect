import { Redis } from 'ioredis';

interface WsRateLimitOptions {
  points: number;
  duration: number;
}

const defaults: Record<string, WsRateLimitOptions> = {
  'message:send': { points: 30, duration: 60 },
  'message:edit': { points: 20, duration: 60 },
  'message:delete': { points: 10, duration: 60 },
  'message:react': { points: 30, duration: 60 },
  'typing': { points: 60, duration: 60 },
  'presence:check': { points: 30, duration: 60 },
};

export async function checkWsRateLimit(
  redis: Redis | null,
  userId: string,
  event: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: Infinity };

  const opts = defaults[event];
  if (!opts) return { allowed: true, remaining: Infinity };

  const key = `ws:rate:${userId}:${event}`;
  const now = Date.now();
  const window = opts.duration * 1000;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, now - window);
  multi.zcard(key);
  multi.zadd(key, now.toString(), `${now}-${Math.random()}`);
  multi.expire(key, opts.duration);

  const results = await multi.exec();
  const count = (results?.[1]?.[1] as number) ?? 0;

  const allowed = count < opts.points;

  return { allowed, remaining: Math.max(0, opts.points - count) };
}
