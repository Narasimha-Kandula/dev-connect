import { Injectable, BadRequestException, Logger, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { SwipeAction, MatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ScoringEngine } from './strategies/scoring-engine';
import { CollaborationHistoryStrategy } from './strategies/collab-history.strategy';
import { MatchScoreInput } from './strategies/matching-strategy.interface';
import { SwipeLimitsService } from '../swipe-limits/swipe-limits.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { expandSkillNames } from '../../common/utils/skill-expansion';
import Redis from 'ioredis';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private scoringEngine: ScoringEngine,
    private swipeLimitsService: SwipeLimitsService,
    private collabHistoryStrategy: CollaborationHistoryStrategy,
    @Inject(REDIS_CLIENT) private redis: Redis | null,
  ) {}

  async swipe(sourceId: string, targetId: string, action: SwipeAction) {
    if (sourceId === targetId) throw new BadRequestException('You cannot swipe on your own profile.');

    const user = await this.prisma.user.findUnique({
      where: { id: sourceId },
      select: { planTier: true },
    });

    await this.swipeLimitsService.incrementSwipeCount(sourceId, user?.planTier ?? 'FREE');

    const swipe = await this.prisma.swipe.upsert({
      where: { sourceId_targetId: { sourceId, targetId } },
      update: { action },
      create: { sourceId, targetId, action },
    });

    this.invalidateRecommendationCache(sourceId);

    if (action === 'PASS') return { swipe, matched: false };

    const reciprocal = await this.prisma.swipe.findUnique({
      where: { sourceId_targetId: { sourceId: targetId, targetId: sourceId } },
    });

    const isMutual = reciprocal && reciprocal.action !== 'PASS';
    if (!isMutual) {
      this.emitLikeNotificationSafe(sourceId, targetId, action);
      return { swipe, matched: false };
    }

    const [userOneId, userTwoId] = [sourceId, targetId].sort();
    const match = await this.prisma.match.upsert({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      update: {},
      create: { userOneId, userTwoId },
    });

    let matchScore = await this.calculateMatchScore(userOneId, userTwoId);
    const collabBoost = await this.collabHistoryStrategy.getBoost(userOneId, userTwoId);
    matchScore = Math.min(matchScore + collabBoost * 100, 100);
    const updatedMatch = await this.prisma.match.update({
      where: { id: match.id },
      data: { matchScore },
    });

    const conversation = await this.prisma.conversation.upsert({
      where: { matchId: match.id },
      update: {},
      create: {
        matchId: match.id,
        members: {
          create: [{ userId: userOneId }, { userId: userTwoId }],
        },
      },
    });

    this.emitNotificationsSafe(sourceId, targetId, match.id);

    return { swipe, matched: true, match: updatedMatch, conversation };
  }

  async calculateMatchScore(userOneId: string, userTwoId: string): Promise<number> {
    const [userOne, userTwo] = await Promise.all([
      this.getFullProfile(userOneId),
      this.getFullProfile(userTwoId),
    ]);

    if (!userOne || !userTwo) return 0;

    const input: MatchScoreInput = {
      userId: userOneId,
      targetUserId: userTwoId,
      skills: userOne.skills.map((s: any) => ({
        skillId: s.skillId,
        name: s.skill.name,
        proficiency: s.proficiency,
      })),
      targetSkills: userTwo.skills.map((s: any) => ({
        skillId: s.skillId,
        name: s.skill.name,
        proficiency: s.proficiency,
      })),
      reputationScore: userOne.reputationScore,
      targetReputationScore: userTwo.reputationScore,
      profileCompleteness: userOne.profileCompleteness,
      targetProfileCompleteness: userTwo.profileCompleteness,
      lastActive: userOne.lastLoginAt,
      targetLastActive: userTwo.lastLoginAt,
      createdAt: userOne.createdAt,
      targetCreatedAt: userTwo.createdAt,
      location: userOne.location,
      targetLocation: userTwo.location,
    };

    const result = this.scoringEngine.calculate(input);
    return result.overallScore;
  }

  async getRecommendations(userId: string, limit = 20) {
    const cacheKey = `match:recs:${userId}:${limit}`;
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch { this.logger.debug('Redis cache miss for recommendations'); }
    }

    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        user: { select: { lastLoginAt: true, createdAt: true } },
      },
    });
    if (!userProfile) return [];

    const candidates = await this.prisma.profile.findMany({
      where: {
        isPublic: true,
        userId: { not: userId },
        NOT: {
          OR: [
            { user: { swipesGiven: { some: { sourceId: userId } } } },
            { user: { blockedUsers: { some: { blockerId: userId } } } },
            { user: { blockedByUsers: { some: { blockedId: userId } } } },
          ],
        },
      },
      include: {
        skills: { include: { skill: true } },
        user: { select: { lastLoginAt: true, createdAt: true } },
      },
      orderBy: { reputationScore: 'desc' },
      take: 100,
    });

    const scored = await Promise.all(
      candidates.map(async (candidate) => {
        const input: MatchScoreInput = {
          userId,
          targetUserId: candidate.userId,
          skills: userProfile.skills.map((s) => ({
            skillId: s.skillId,
            name: s.skill.name,
            proficiency: s.proficiency,
          })),
          targetSkills: candidate.skills.map((s: any) => ({
            skillId: s.skillId,
            name: s.skill.name,
            proficiency: s.proficiency,
          })),
          reputationScore: userProfile.reputationScore,
          targetReputationScore: candidate.reputationScore,
          profileCompleteness: userProfile.profileCompleteness,
          targetProfileCompleteness: candidate.profileCompleteness,
          lastActive: userProfile.user.lastLoginAt,
          targetLastActive: candidate.user.lastLoginAt,
          createdAt: userProfile.user.createdAt,
          targetCreatedAt: candidate.user.createdAt,
          location: userProfile.location,
          targetLocation: candidate.location,
        };

        const result = this.scoringEngine.calculate(input);
        return {
          userId: candidate.userId,
          displayName: candidate.displayName,
          headline: candidate.headline,
          avatarUrl: candidate.avatarUrl,
          location: candidate.location,
          experienceLevel: candidate.experienceLevel,
          reputationScore: candidate.reputationScore,
          skills: candidate.skills.map((s: any) => ({ name: s.skill.name, proficiency: s.proficiency })),
          matchScore: result.overallScore,
          breakdown: result.breakdown,
        };
      }),
    );

    const ranked = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);

    if (this.redis) {
      this.redis.setex(cacheKey, 120, JSON.stringify(ranked)).catch(() => {});
    }

    return ranked;
  }

  private async getFullProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        user: { select: { lastLoginAt: true, createdAt: true } },
      },
    });
    if (!profile) return null;

    return {
      ...profile,
      lastLoginAt: profile.user.lastLoginAt,
      createdAt: profile.user.createdAt,
    };
  }

  async archiveMatch(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.ARCHIVED },
    });
  }

  async unmatch(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.ARCHIVED },
    });
  }

  async createConnection(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }
    if (match.status !== 'ACTIVE') throw new BadRequestException('Cannot connect on inactive match');
    const [userAId, userBId] = [match.userOneId, match.userTwoId].sort();
    return this.prisma.connection.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId, tag: null },
    });
  }

  async undoSwipe(userId: string) {
    const lastSwipe = await this.prisma.swipe.findFirst({
      where: { sourceId: userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastSwipe) throw new BadRequestException('No swipe to undo');

    const [userOneId, userTwoId] = [userId, lastSwipe.targetId].sort();
    const match = await this.prisma.match.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
    });

    if (match) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { matchId: match.id },
      });
      if (conversation) {
        await this.prisma.message.deleteMany({ where: { conversationId: conversation.id } });
        await this.prisma.conversationMember.deleteMany({ where: { conversationId: conversation.id } });
        await this.prisma.conversation.delete({ where: { id: conversation.id } });
      }
      const [userAId, userBId] = [userId, lastSwipe.targetId].sort();
      await this.prisma.connection.deleteMany({
        where: { userAId, userBId },
      });
      await this.prisma.collabRoom.deleteMany({
        where: { matchId: match.id },
      });
      await this.prisma.match.delete({ where: { id: match.id } });
    }

    this.invalidateRecommendationCache(userId);
    await this.prisma.swipe.delete({ where: { id: lastSwipe.id } });
    return { undone: true, targetId: lastSwipe.targetId, hadMatch: !!match };
  }

  private invalidateRecommendationCache(userId: string): void {
    const redis = this.redis;
    if (redis) {
      const pattern = `match:recs:${userId}:*`;
      redis.keys(pattern).then((keys) => {
        if (keys.length > 0) redis.del(...keys).catch(() => {});
      }).catch(() => {});
    }
  }

  private emitNotificationsSafe(sourceId: string, targetId: string, matchId: string): void {
    Promise.all([
      this.notifications.create(sourceId, 'MATCH', 'New match!', 'You matched with someone new.', { matchId })
        .catch((e) => this.logger.error(`Failed to notify source ${sourceId}: ${(e as Error).message}`)),
      this.notifications.create(targetId, 'MATCH', 'New match!', 'You matched with someone new.', { matchId })
        .catch((e) => this.logger.error(`Failed to notify target ${targetId}: ${(e as Error).message}`)),
    ]).catch((e) => this.logger.error(`Unexpected notification error: ${(e as Error).message}`));
  }

  private emitLikeNotificationSafe(sourceId: string, targetId: string, action: SwipeAction): void {
    this.prisma.profile.findUnique({ where: { userId: sourceId }, select: { displayName: true } })
      .then((profile) => {
        const name = profile?.displayName ?? 'Someone';
        const label = action === 'SUPER_LIKE' ? 'super-liked' : 'liked';
        this.notifications.create(
          targetId, 'INVITATION',
          `${name} ${label} you!`,
          `${name} is interested in connecting with you.`,
          { sourceUserId: sourceId },
        ).catch((e) => this.logger.error(`Failed to notify target ${targetId}: ${(e as Error).message}`));
      })
      .catch((e) => this.logger.error(`Failed to look up source profile ${sourceId}: ${(e as Error).message}`));
  }

  async startProject(matchId: string, userId: string, projectTitle: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }

    const partnerId = match.userOneId === userId ? match.userTwoId : match.userOneId;

    const project = await this.prisma.project.create({
      data: {
        ownerId: userId,
        title: projectTitle,
        status: 'IN_PROGRESS',
        members: {
          create: [
            { userId, role: 'OWNER' },
            { userId: partnerId, role: 'CONTRIBUTOR' },
          ],
        },
      },
      include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } } },
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: { matchId },
    });

    if (conversation) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { projectId: project.id },
      });
    }

    const collabRoom = await this.prisma.collabRoom.create({
      data: {
        name: projectTitle,
        matchId,
        projectId: project.id,
        participants: {
          create: [
            { userId },
            { userId: partnerId },
          ],
        },
      },
    });

    return { project, collabRoom };
  }

  listMatches(userId: string, limit = 50, cursor?: string) {
    return this.prisma.match.findMany({
      where: { OR: [{ userOneId: userId }, { userTwoId: userId }], status: 'ACTIVE' },
      include: {
        userOne: { include: { profile: true } },
        userTwo: { include: { profile: true } },
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  listConnections(userId: string, limit = 50, cursor?: string) {
    return this.prisma.connection.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }
}
