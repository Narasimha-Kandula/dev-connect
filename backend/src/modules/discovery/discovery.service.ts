import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  data: Array<Record<string, unknown>>;
  expiresAt: number;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private prisma: PrismaService) {}

  async getFeed(userId: string, limit = 20) {
    const cacheKey = `discover:${userId}`;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        display_name: string;
        headline: string | null;
        bio: string | null;
        avatar_url: string | null;
        location: string | null;
        reputation_score: number;
        is_public: boolean;
        skills_json: string | null;
      }>
    >`
      SELECT p.id, p.user_id, p.display_name, p.headline, p.bio,
             p.avatar_url, p.location, p.reputation_score, p.is_public,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'skillId', s.id,
            'name', s.name,
            'proficiency', ps.proficiency
          ))
          FROM profile_skills ps
          JOIN skills s ON s.id = ps.skill_id
          WHERE ps.profile_id = p.id),
          '[]'::json
        )::text AS skills_json
      FROM profiles p
      WHERE p.is_public = true
        AND p.user_id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM swipes sw WHERE sw.source_id = ${userId} AND sw.target_id = p.user_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = ${userId} AND b.blocked_id = p.user_id)
             OR (b.blocked_id = ${userId} AND b.blocker_id = p.user_id)
        )
      ORDER BY p.reputation_score DESC
      LIMIT ${limit}
    `;

    const result = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      headline: r.headline,
      bio: r.bio,
      avatarUrl: r.avatar_url,
      location: r.location,
      reputationScore: Number(r.reputation_score),
      isPublic: r.is_public,
      skills: JSON.parse(r.skills_json ?? '[]'),
    }));

    this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (entry.expiresAt < now) this.cache.delete(key);
      }
    }

    return result;
  }
}
