import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private searchService?: SearchService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDeletedAccounts() {
    this.logger.log('Running daily cleanup of permanently deleted accounts…');
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const users = await this.prisma.user.findMany({
      where: { deletedAt: { not: null }, scheduledDeleteAt: { lte: new Date() } },
      select: { id: true, email: true },
    });

    for (const user of users) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.message.deleteMany({ where: { senderId: user.id } });
          await tx.messageReaction.deleteMany({ where: { userId: user.id } });
          await tx.conversationMember.deleteMany({ where: { userId: user.id } });
          await tx.notification.deleteMany({ where: { userId: user.id } });
          await tx.session.deleteMany({ where: { userId: user.id } });
          await tx.swipe.deleteMany({ where: { OR: [{ sourceId: user.id }, { targetId: user.id }] } });
          await tx.match.deleteMany({ where: { OR: [{ userOneId: user.id }, { userTwoId: user.id }] } });
          await tx.blockedUser.deleteMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } });
          await tx.savedProfile.deleteMany({ where: { OR: [{ userId: user.id }, { savedUserId: user.id }] } });
          await tx.profileSkill.deleteMany({ where: { profile: { userId: user.id } } });
          await tx.profile.deleteMany({ where: { userId: user.id } });
          await tx.user.delete({ where: { id: user.id } });
        });
        this.logger.log(`Permanently deleted user ${user.id} (email anonymized)`);
      } catch (e) {
        this.logger.error(`Failed to delete user ${user.id}: ${(e as Error).message}`);
      }
    }

    this.logger.log(`Cleanup complete: ${users.length} accounts permanently removed.`);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reindexSearch() {
    if (!this.searchService) return;
    this.logger.log('Running MeiliSearch re-index…');
    try {
      await this.searchService.syncAllUsers();
      await this.searchService.syncAllProjects();
      this.logger.log('MeiliSearch re-index complete');
    } catch (err) {
      this.logger.error(`MeiliSearch re-index failed: ${(err as Error).message}`);
    }
  }
}
