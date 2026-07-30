import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { expandSkillNames, getExpandedSkillTerms } from '../../common/utils/skill-expansion';
import Redis from 'ioredis';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  async getFeed(userId: string, filters: {
    skill?: string;
    location?: string;
    experienceLevel?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    hideSelf?: string;
    remote?: string;
    available?: string;
  } = {}) {
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const cacheKey = `discover:${userId}:${JSON.stringify(filters)}`;
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch { this.logger.debug('Redis cache miss for discover feed'); }
    }

    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { skills: { select: { skillId: true } } },
    });
    const userSkillIds = userProfile?.skills.map((s) => s.skillId) ?? [];

    const conditions = [
      'p.is_public = true',
      'NOT EXISTS (SELECT 1 FROM swipes sw WHERE sw.source_id = $1 AND sw.target_id = p.user_id)',
      'NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id) OR (b.blocked_id = $1 AND b.blocker_id = p.user_id))',
    ];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (filters.hideSelf === 'true') {
      conditions.push(`p.user_id != $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (filters.skill) {
      const rawSkillNames = filters.skill.split(',').map((s) => s.trim()).filter(Boolean);
      const skillNames = expandSkillNames(rawSkillNames);
      if (skillNames.length === 1) {
        conditions.push(`EXISTS (SELECT 1 FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.profile_id = p.id AND s.name ILIKE $${paramIndex})`);
        params.push(skillNames[0]);
        paramIndex++;
      } else if (skillNames.length > 1) {
        const skillConditions = skillNames.map((_, i) =>
          `EXISTS (SELECT 1 FROM profile_skills ps${i} JOIN skills s${i} ON s${i}.id = ps${i}.skill_id WHERE ps${i}.profile_id = p.id AND s${i}.name ILIKE $${paramIndex + i})`
        );
        conditions.push(`(${skillConditions.join(' OR ')})`);
        skillNames.forEach((s) => params.push(s));
        paramIndex += skillNames.length;
      }
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

    if (filters.remote === 'true') {
      conditions.push(`p.location ILIKE '%remote%'`);
    }

    if (filters.available === 'true') {
      conditions.push(`p.availability::text IN ('OPEN_TO_WORK', 'HIRING', 'OPEN_TO_COLLAB')`);
    }

    const whereClause = conditions.join('\n      AND ');

    let orderClause: string;
    if (filters.sort === 'newest') {
      orderClause = 'p.created_at DESC';
    } else if (userSkillIds.length > 0) {
      const skillIdsList = userSkillIds.map((_, i) => `$${paramIndex + i}`).join(', ');
      orderClause = `(
        SELECT COUNT(*) FROM profile_skills ps
        WHERE ps.profile_id = p.id AND ps.skill_id IN (${skillIdsList})
      ) DESC, p.reputation_score DESC`;
      userSkillIds.forEach((sid) => params.push(sid));
      paramIndex += userSkillIds.length;
    } else {
      orderClause = 'p.reputation_score DESC';
    }

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
      ORDER BY ${orderClause}
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

    if (this.redis) {
      this.redis.setex(cacheKey, 30, JSON.stringify(result)).catch(() => {});
    }

    return result;
  }
}
