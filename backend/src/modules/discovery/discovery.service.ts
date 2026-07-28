import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private redis: Redis | null = null;
  private redisAvailable = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initRedis();
  }

  private initRedis() {
    try {
      const url = this.config.get<string>('REDIS_URL');
      const host = this.config.get('redis.host');
      const port = this.config.get('redis.port');
      const password = this.config.get('redis.password');

      if (!url && !host) return;

      const opts: any = url
        ? { url, maxRetriesPerRequest: 1, retryStrategy: () => null }
        : { host, port, password, maxRetriesPerRequest: 1, retryStrategy: () => null };

      if (url?.startsWith('rediss://')) {
        opts.tls = { rejectUnauthorized: false };
      }

      this.redis = new Redis(opts);
      this.redis.on('error', () => { this.redisAvailable = false; });
      this.redis.on('connect', () => { this.redisAvailable = true; });
    } catch { /* redis unavailable */ }
  }

  async getFeed(userId: string, filters: {
    skill?: string;
    location?: string;
    experienceLevel?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const cacheKey = `discover:${userId}:${JSON.stringify(filters)}`;
    if (this.redisAvailable) {
      try {
        const cached = await this.redis!.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch { /* redis miss */ }
    }

    const conditions = [
      'p.is_public = true',
      'p.user_id != $1',
      'NOT EXISTS (SELECT 1 FROM swipes sw WHERE sw.source_id = $1 AND sw.target_id = p.user_id)',
      'NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id) OR (b.blocked_id = $1 AND b.blocker_id = p.user_id))',
    ];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (filters.skill) {
      conditions.push(`EXISTS (SELECT 1 FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.profile_id = p.id AND s.name ILIKE $${paramIndex})`);
      params.push(filters.skill);
      paramIndex++;
    }

    if (filters.location) {
      conditions.push(`p.location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    if (filters.experienceLevel) {
      conditions.push(`p.experience_level = $${paramIndex}`);
      params.push(filters.experienceLevel);
      paramIndex++;
    }

    const whereClause = conditions.join('\n      AND ');

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        user_id: string;
        display_name: string;
        headline: string | null;
        bio: string | null;
        avatar_url: string | null;
        location: string | null;
        experience_level: string | null;
        reputation_score: number;
        skills_json: string | null;
      }>
    >(`
      SELECT p.id, p.user_id, p.display_name, p.headline, p.bio,
             p.avatar_url, p.location, p.experience_level, p.reputation_score,
        COALESCE(
          (SELECT json_agg(json_build_object('skillId', s.id, 'name', s.name, 'proficiency', ps.proficiency))
           FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id
           WHERE ps.profile_id = p.id), '[]'::json
        )::text AS skills_json
      FROM profiles p
      WHERE ${whereClause}
      ORDER BY p.reputation_score DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, limit, offset);

    const result = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      headline: r.headline,
      bio: r.bio,
      avatarUrl: r.avatar_url,
      location: r.location,
      experienceLevel: r.experience_level,
      reputationScore: Number(r.reputation_score),
      skills: JSON.parse(r.skills_json ?? '[]'),
    }));

    if (this.redisAvailable) {
      this.redis!.setex(cacheKey, 30, JSON.stringify(result)).catch(() => {});
    }

    return result;
  }
}
