import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('RedisModule');
        const url = config.get<string>('REDIS_URL');
        const host = config.get('app.redis.host');
        const port = config.get('app.redis.port');
        const password = config.get('app.redis.password');

        if (!url && !host) {
          logger.warn('Redis not configured — running without cache');
          return null;
        }

        const retryStrategy = (times: number) => (times > 3 ? null : Math.min(times * 200, 2000));

        // Prefer explicit host/port/password — ioredis does not honor the
        // password embedded in the `url` option, which causes NOAUTH errors.
        const opts: any = host
          ? { host, port, password: password || undefined, maxRetriesPerRequest: 2, retryStrategy }
          : { url, maxRetriesPerRequest: 2, retryStrategy };

        if (url?.startsWith('rediss://')) {
          opts.tls = { rejectUnauthorized: false };
        }

        const client = new Redis(opts);
        client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
        client.on('connect', () => logger.log('Redis connected'));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
