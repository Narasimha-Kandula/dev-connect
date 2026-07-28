import { Injectable, BadRequestException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SwipeAction, MatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async swipe(sourceId: string, targetId: string, action: SwipeAction) {
    if (sourceId === targetId) throw new BadRequestException('You cannot swipe on your own profile.');

    const swipe = await this.prisma.swipe.upsert({
      where: { sourceId_targetId: { sourceId, targetId } },
      update: { action },
      create: { sourceId, targetId, action },
    });

    if (action === 'PASS') return { swipe, matched: false };

    const reciprocal = await this.prisma.swipe.findUnique({
      where: { sourceId_targetId: { sourceId: targetId, targetId: sourceId } },
    });

    const isMutual = reciprocal && reciprocal.action !== 'PASS';
    if (!isMutual) return { swipe, matched: false };

    const [userOneId, userTwoId] = [sourceId, targetId].sort();
    const match = await this.prisma.match.upsert({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      update: {},
      create: { userOneId, userTwoId },
    });

    const matchScore = await this.calculateMatchScore(userOneId, userTwoId);
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

    this.emitNotificationsSafe(sourceId, targetId);

    return { swipe, matched: true, match: updatedMatch, conversation };
  }

  private async calculateMatchScore(userOneId: string, userTwoId: string): Promise<number> {
    const [skillsOne, skillsTwo] = await Promise.all([
      this.prisma.profileSkill.findMany({
        where: { profile: { userId: userOneId } },
        select: { skillId: true },
      }),
      this.prisma.profileSkill.findMany({
        where: { profile: { userId: userTwoId } },
        select: { skillId: true },
      }),
    ]);

    const setOne = new Set(skillsOne.map((s) => s.skillId));
    const setTwo = new Set(skillsTwo.map((s) => s.skillId));
    const overlap = [...setOne].filter((id) => setTwo.has(id)).length;
    const union = new Set([...setOne, ...setTwo]).size;
    return union > 0 ? overlap / union : 0;
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
    const otherUserId = match.userOneId === userId ? match.userTwoId : match.userOneId;
    await this.prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: otherUserId } },
      update: {},
      create: { blockerId: userId, blockedId: otherUserId },
    });
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.BLOCKED },
    });
  }

  async createConnection(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    const [userAId, userBId] = [match.userOneId, match.userTwoId].sort();
    return this.prisma.connection.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId, tag: null },
    });
  }

  private emitNotificationsSafe(sourceId: string, targetId: string): void {
    Promise.all([
      this.notifications
        .create(sourceId, 'MATCH', 'New match!', 'You matched with someone new.')
        .catch((e) =>
          this.logger.error(`Failed to notify source ${sourceId}: ${(e as Error).message}`),
        ),
      this.notifications
        .create(targetId, 'MATCH', 'New match!', 'You matched with someone new.')
        .catch((e) =>
          this.logger.error(`Failed to notify target ${targetId}: ${(e as Error).message}`),
        ),
    ]).catch((e) =>
      this.logger.error(`Unexpected notification error: ${(e as Error).message}`),
    );
  }

  listMatches(userId: string) {
    return this.prisma.match.findMany({
      where: { OR: [{ userOneId: userId }, { userTwoId: userId }], status: 'ACTIVE' },
      include: {
        userOne: { include: { profile: true } },
        userTwo: { include: { profile: true } },
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
      },
    });
  }
}
