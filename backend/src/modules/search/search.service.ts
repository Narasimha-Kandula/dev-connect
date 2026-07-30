import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import Redis from 'ioredis';

export interface SearchResult {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  experienceLevel: string | null;
  reputationScore: number;
  skills: string[];
  matchScore?: number;
}

export interface ProjectSearchResult {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  budget: string | null;
  timeline: string | null;
  status: string;
  ownerName: string;
  ownerAvatar: string | null;
  createdAt: number;
  matchScore?: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private meiliClient: any = null;
  private meiliIndex: any = null;
  private meiliProjectIndex: any = null;
  private indexName = 'users';
  private projectIndexName = 'projects';
  private available = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  async onModuleInit() {
    await this.initMeiliSearch();
  }

  private async initMeiliSearch() {
    try {
      const host = this.config.get<string>('MEILISEARCH_HOST');
      const apiKey = this.config.get<string>('MEILISEARCH_API_KEY');

      if (!host) {
        this.logger.warn('MeiliSearch host not configured — search disabled');
        return;
      }

      // @ts-expect-error Dynamic import lacks types
      const { MeiliSearch } = await import('meilisearch');
      this.meiliClient = new MeiliSearch({ host, apiKey });
      this.available = true;

      await this.ensureIndex();
      await this.syncAllUsers();

      this.logger.log(`MeiliSearch initialized at ${host}`);
    } catch (err) {
      this.logger.error(`MeiliSearch init failed: ${(err as Error).message} — search degraded to DB fallback`);
      this.available = false;
    }
  }

  private async ensureIndex() {
    try {
      const indexes = await this.meiliClient.getIndexes();
      const exists = indexes.results?.some((i: any) => i.uid === this.indexName);
      const projExists = indexes.results?.some((i: any) => i.uid === this.projectIndexName);

      if (!exists) {
        await this.meiliClient.createIndex(this.indexName, { primaryKey: 'id' });
        this.logger.log(`Created MeiliSearch index: ${this.indexName}`);
      }
      if (!projExists) {
        await this.meiliClient.createIndex(this.projectIndexName, { primaryKey: 'id' });
        this.logger.log(`Created MeiliSearch index: ${this.projectIndexName}`);
      }

      this.meiliIndex = this.meiliClient.index(this.indexName);
      this.meiliProjectIndex = this.meiliClient.index(this.projectIndexName);

      await this.meiliIndex.updateSettings({
        searchableAttributes: ['displayName', 'headline', 'bio', 'skills'],
        filterableAttributes: ['location', 'experienceLevel', 'reputationScore'],
        sortableAttributes: ['reputationScore', 'createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
        pagination: { maxTotalHits: 10000 },
      });

      await this.meiliProjectIndex.updateSettings({
        searchableAttributes: ['title', 'description', 'requiredSkills'],
        filterableAttributes: ['status', 'requiredSkills'],
        sortableAttributes: ['createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
        pagination: { maxTotalHits: 10000 },
      });
    } catch (err) {
      this.logger.error(`Failed to configure index: ${(err as Error).message}`);
    }
  }

  async indexUser(userId: string): Promise<void> {
    if (!this.available) return;

    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
          user: { select: { createdAt: true } },
        },
      });
      if (!profile || !profile.isPublic) return;

      const document = {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl,
        location: profile.location ?? '',
        experienceLevel: profile.experienceLevel ?? '',
        reputationScore: profile.reputationScore,
        skills: profile.skills.map((s) => s.skill.name),
        createdAt: profile.createdAt.getTime(),
      };

      await this.meiliIndex.addDocuments([document]);
    } catch (err) {
      this.logger.error(`Failed to index user ${userId}: ${(err as Error).message}`);
    }
  }

  async removeUser(userId: string): Promise<void> {
    if (!this.available) return;

    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (profile) {
        await this.meiliIndex.deleteDocument(profile.id);
      }
    } catch (err) {
      this.logger.error(`Failed to remove user ${userId}: ${(err as Error).message}`);
    }
  }

  async syncAllUsers(): Promise<void> {
    if (!this.available) return;

    try {
      const profiles = await this.prisma.profile.findMany({
        where: { isPublic: true },
        include: {
          skills: { include: { skill: true } },
          user: { select: { createdAt: true } },
        },
        take: 50000,
      });

      const documents = profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        headline: p.headline ?? '',
        bio: p.bio ?? '',
        avatarUrl: p.avatarUrl,
        location: p.location ?? '',
        experienceLevel: p.experienceLevel ?? '',
        reputationScore: p.reputationScore,
        skills: p.skills.map((s) => s.skill.name),
        createdAt: p.createdAt.getTime(),
      }));

      if (documents.length > 0) {
        await this.meiliIndex.addDocuments(documents);
        this.logger.log(`Synced ${documents.length} users to MeiliSearch`);
      }

      await this.syncAllProjects();
    } catch (err) {
      this.logger.error(`Full sync failed: ${(err as Error).message}`);
    }
  }

  async search(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      location?: string;
      experienceLevel?: string;
      skill?: string;
      sort?: string;
    } = {},
  ): Promise<{ hits: SearchResult[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    if (this.available && query) {
      return this.searchMeili(query, options, limit, offset);
    }

    return this.searchDatabase(query, options, limit, offset);
  }

  private async searchMeili(
    query: string,
    options: { location?: string; experienceLevel?: string; skill?: string; sort?: string },
    limit: number,
    offset: number,
  ): Promise<{ hits: SearchResult[]; total: number }> {
    try {
      const filter: string[] = [];
      if (options.location) filter.push(`location = "${options.location}"`);
      if (options.experienceLevel) filter.push(`experienceLevel = "${options.experienceLevel}"`);

      let sort: string[];
      switch (options.sort) {
        case 'newest': sort = ['createdAt:desc']; break;
        case 'reputation': sort = ['reputationScore:desc']; break;
        case 'active': sort = ['createdAt:desc']; break;
        default: sort = ['reputationScore:desc']; break;
      }

      const result: any = await this.meiliIndex.search(query, {
        limit,
        offset,
        filter: filter.length > 0 ? filter.join(' AND ') : undefined,
        attributesToHighlight: ['displayName', 'headline', 'bio', 'skills'],
        sort,
      });

      return {
        hits: result.hits.map((h: any) => ({
          id: h.id,
          userId: h.userId,
          displayName: h.displayName,
          headline: h.headline || null,
          bio: h.bio || null,
          avatarUrl: h.avatarUrl || null,
          location: h.location || null,
          experienceLevel: h.experienceLevel || null,
          reputationScore: h.reputationScore,
          skills: h.skills || [],
        })),
        total: result.estimatedTotalHits ?? result.hits.length,
      };
    } catch (err) {
      this.logger.error(`MeiliSearch query failed: ${(err as Error).message} — falling back to DB`);
      return this.searchDatabase(query, options, limit, offset);
    }
  }

  private async searchDatabase(
    query: string,
    options: { location?: string; experienceLevel?: string; skill?: string; sort?: string },
    limit: number,
    offset: number,
  ): Promise<{ hits: SearchResult[]; total: number }> {
    const conditions = ['p.is_public = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (query) {
      conditions.push(`(
        p.display_name ILIKE $${paramIndex}
        OR p.headline ILIKE $${paramIndex}
        OR p.bio ILIKE $${paramIndex}
        OR EXISTS (SELECT 1 FROM profile_skills ps2 JOIN skills s2 ON s2.id = ps2.skill_id WHERE ps2.profile_id = p.id AND s2.name ILIKE $${paramIndex})
      )`);
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (options.location) {
      conditions.push(`p.location ILIKE $${paramIndex}`);
      params.push(`%${options.location}%`);
      paramIndex++;
    }

    if (options.experienceLevel) {
      conditions.push(`p.experience_level = $${paramIndex}`);
      params.push(options.experienceLevel);
      paramIndex++;
    }

    if (options.skill) {
      conditions.push(`EXISTS (SELECT 1 FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.profile_id = p.id AND s.name ILIKE $${paramIndex})`);
      params.push(`%${options.skill}%`);
      paramIndex++;
    }

    const whereClause = conditions.join('\n      AND ');

    let orderClause: string;
    switch (options.sort) {
      case 'newest': orderClause = 'p.created_at DESC'; break;
      case 'reputation': orderClause = 'p.reputation_score DESC'; break;
      case 'active': orderClause = 'p.updated_at DESC'; break;
      default: orderClause = 'p.reputation_score DESC'; break;
    }

    const countResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM profiles p WHERE ${whereClause}`,
      ...params,
    );
    const total = Number(countResult[0]?.count ?? 0);

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
    >(
      `SELECT p.id, p.user_id, p.display_name, p.headline, p.bio,
              p.avatar_url, p.location, p.experience_level, p.reputation_score,
        COALESCE(
          (SELECT json_agg(json_build_object('skillId', s.id, 'name', s.name))
           FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id
           WHERE ps.profile_id = p.id), '[]'::json
        )::text AS skills_json
       FROM profiles p
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...params, limit, offset,
    );

    return {
      hits: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        displayName: r.display_name,
        headline: r.headline,
        bio: r.bio,
        avatarUrl: r.avatar_url,
        location: r.location,
        experienceLevel: r.experience_level,
        reputationScore: Number(r.reputation_score),
        skills: (JSON.parse(r.skills_json ?? '[]') as Array<{ name: string }>).map((s) => s.name),
      })),
      total,
    };
  }

  // ── Project Indexing ──

  async indexProject(projectId: string): Promise<void> {
    if (!this.available) return;
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { owner: { include: { profile: true } } },
      });
      if (!project) return;

      const document = {
        id: project.id,
        ownerId: project.ownerId,
        title: project.title,
        description: project.description ?? '',
        requiredSkills: (project.requiredSkills as string[]) ?? [],
        budget: project.budget ?? '',
        timeline: project.timeline ?? '',
        status: project.status,
        ownerName: project.owner.profile?.displayName ?? '',
        ownerAvatar: project.owner.profile?.avatarUrl ?? null,
        createdAt: project.createdAt.getTime(),
      };

      await this.meiliProjectIndex.addDocuments([document]);
    } catch (err) {
      this.logger.error(`Failed to index project ${projectId}: ${(err as Error).message}`);
    }
  }

  async removeProject(projectId: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.meiliProjectIndex.deleteDocument(projectId);
    } catch (err) {
      this.logger.error(`Failed to remove project ${projectId}: ${(err as Error).message}`);
    }
  }

  async syncAllProjects(): Promise<void> {
    if (!this.available) return;
    try {
      const projects = await this.prisma.project.findMany({
        include: { owner: { include: { profile: true } } },
        take: 50000,
      });

      const documents = projects.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description ?? '',
        requiredSkills: (p.requiredSkills as string[]) ?? [],
        budget: p.budget ?? '',
        timeline: p.timeline ?? '',
        status: p.status,
        ownerName: p.owner.profile?.displayName ?? '',
        ownerAvatar: p.owner.profile?.avatarUrl ?? null,
        createdAt: p.createdAt.getTime(),
      }));

      if (documents.length > 0) {
        await this.meiliProjectIndex.addDocuments(documents);
        this.logger.log(`Synced ${documents.length} projects to MeiliSearch`);
      }
    } catch (err) {
      this.logger.error(`Project sync failed: ${(err as Error).message}`);
    }
  }

  async searchProjects(
    query: string,
    options: { limit?: number; offset?: number; status?: string; skill?: string; sort?: string } = {},
  ): Promise<{ hits: ProjectSearchResult[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    if (this.available && query) {
      return this.searchProjectsMeili(query, options, limit, offset);
    }
    return this.searchProjectsDatabase(query, options, limit, offset);
  }

  private async searchProjectsMeili(
    query: string,
    options: { status?: string; skill?: string; sort?: string },
    limit: number,
    offset: number,
  ): Promise<{ hits: ProjectSearchResult[]; total: number }> {
    try {
      const filter: string[] = [];
      if (options.status) filter.push(`status = "${options.status}"`);
      if (options.skill) filter.push(`requiredSkills = "${options.skill}"`);

      let sort: string[];
      switch (options.sort) {
        case 'newest': sort = ['createdAt:desc']; break;
        default: sort = ['createdAt:desc']; break;
      }

      const result: any = await this.meiliProjectIndex.search(query, {
        limit, offset,
        filter: filter.length > 0 ? filter.join(' AND ') : undefined,
        attributesToHighlight: ['title', 'description'],
        sort,
      });

      return {
        hits: result.hits.map((h: any) => ({
          id: h.id,
          ownerId: h.ownerId,
          title: h.title,
          description: h.description || null,
          requiredSkills: h.requiredSkills || [],
          budget: h.budget || null,
          timeline: h.timeline || null,
          status: h.status,
          ownerName: h.ownerName,
          ownerAvatar: h.ownerAvatar || null,
          createdAt: h.createdAt,
        })),
        total: result.estimatedTotalHits ?? result.hits.length,
      };
    } catch (err) {
      this.logger.error(`MeiliSearch project query failed: ${(err as Error).message} — falling back to DB`);
      return this.searchProjectsDatabase(query, options, limit, offset);
    }
  }

  private async searchProjectsDatabase(
    query: string,
    options: { status?: string; skill?: string; sort?: string },
    limit: number,
    offset: number,
  ): Promise<{ hits: ProjectSearchResult[]; total: number }> {
    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (options.status) where.status = options.status;

    const orderBy: any = options.sort === 'newest'
      ? { createdAt: 'desc' as const }
      : { createdAt: 'desc' as const };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: { owner: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      hits: projects.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description,
        requiredSkills: (p.requiredSkills as string[]) ?? [],
        budget: p.budget,
        timeline: p.timeline,
        status: p.status,
        ownerName: p.owner.profile?.displayName ?? 'Unknown',
        ownerAvatar: p.owner.profile?.avatarUrl ?? null,
        createdAt: p.createdAt.getTime(),
      })),
      total,
    };
  }

  async autocomplete(query: string, limit = 10): Promise<Array<{ id: string; userId: string; displayName: string; headline: string | null; avatarUrl: string | null }>> {
    if (this.available) {
      try {
        const result: any = await this.meiliIndex.search(query, {
          limit,
          attributesToRetrieve: ['id', 'userId', 'displayName', 'headline', 'avatarUrl'],
        });
        return result.hits.map((h: any) => ({
          id: h.id,
          userId: h.userId,
          displayName: h.displayName,
          headline: h.headline || null,
          avatarUrl: h.avatarUrl || null,
        }));
      } catch { /* MeiliSearch fallback - continue with DB query */ }
    }

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; user_id: string; display_name: string; headline: string | null; avatar_url: string | null }>
    >(
      `SELECT id, user_id, display_name, headline, avatar_url FROM profiles
       WHERE is_public = true AND display_name ILIKE $1
       ORDER BY reputation_score DESC LIMIT $2`,
      `%${query}%`, limit,
    );

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      headline: r.headline,
      avatarUrl: r.avatar_url,
    }));
  }
}
