import { Injectable, Logger } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CollaborationHistoryStrategy implements MatchingStrategy {
  readonly name = 'collaboration_history';
  readonly weight = 2.5;
  private readonly logger = new Logger(CollaborationHistoryStrategy.name);

  constructor(private prisma: PrismaService) {}

  score(input: MatchScoreInput): number {
    // This is called synchronously; we fetch data lazily via the service.
    // The real score is computed by looking up the collab pair table.
    return 0; // Default 0; the actual boost is applied in the matching service.
  }

  async getBoost(userAId: string, userBId: string): Promise<number> {
    try {
      const [sortedA, sortedB] = [userAId, userBId].sort();
      const pair = await this.prisma.collaborationPair.findUnique({
        where: { userAId_userBId: { userAId: sortedA, userBId: sortedB } },
      });

      if (!pair) return 0;

      // Boost based on how many successful projects and average score
      const projectBoost = Math.min(pair.projectsCount / 3, 1) * 0.15; // 0-0.15
      const scoreBoost = (pair.averageScore / 100) * 0.15; // 0-0.15
      const recencyBoost = pair.lastCollaborated
        ? Math.max(0, 1 - (Date.now() - pair.lastCollaborated.getTime()) / (365 * 24 * 60 * 60 * 1000)) * 0.05
        : 0;

      return Math.min(projectBoost + scoreBoost + recencyBoost, 0.35);
    } catch (err) {
      this.logger.error(`Failed to compute collab boost: ${(err as Error).message}`);
      return 0;
    }
  }
}
