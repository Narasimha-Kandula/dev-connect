import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SwipeAction } from '@prisma/client';
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
    if (sourceId === targetId) throw new BadRequestException('Cannot swipe on yourself');

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

    return { swipe, matched: true, match, conversation };
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
