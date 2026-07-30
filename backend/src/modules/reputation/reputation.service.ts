import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(reviewerId: string, targetId: string, rating: number, projectId?: string, comment?: string) {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
    if (reviewerId === targetId) throw new Error('Cannot review yourself');

    const review = await this.prisma.review.upsert({
      where: { reviewerId_targetId_projectId: { reviewerId, targetId, projectId: projectId ?? '' } },
      update: { rating, comment },
      create: { reviewerId, targetId, rating, projectId, comment },
    });

    await this.updateReputationScore(targetId);
    return review;
  }

  async getReputation(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } },
    });

    const contributions = await this.prisma.contribution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { title: true } } },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalImpact = contributions.reduce((sum, c) => sum + c.impactScore, 0);

    const completionRate = await this.calculateCompletionRate(userId);

    return {
      score: profile.reputationScore,
      breakdown: {
        averageRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews.length,
        totalImpact,
        contributionCount: contributions.length,
        completionRate,
      },
      reviews,
      contributions,
    };
  }

  async createContribution(userId: string, projectId: string, data: {
    description?: string;
    linesOfCode?: number;
    commits?: number;
    tasksDone?: number;
    verified?: boolean;
  }) {
    const contribution = await this.prisma.contribution.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: {
        description: data.description ?? undefined,
        linesOfCode: data.linesOfCode ?? 0,
        commits: data.commits ?? 0,
        tasksDone: data.tasksDone ?? 0,
        verified: data.verified ?? false,
      },
      create: {
        userId,
        projectId,
        description: data.description,
        linesOfCode: data.linesOfCode ?? 0,
        commits: data.commits ?? 0,
        tasksDone: data.tasksDone ?? 0,
        verified: data.verified ?? false,
      },
    });

    const impactScore = this.calculateImpactScore(contribution.linesOfCode, contribution.commits, contribution.tasksDone);
    await this.prisma.contribution.update({
      where: { id: contribution.id },
      data: { impactScore },
    });

    await this.updateReputationScore(userId);

    const updated = await this.prisma.contribution.findUnique({
      where: { id: contribution.id },
      include: { project: { select: { title: true } } },
    });
    return updated;
  }

  async updateCollaborationPair(userAId: string, userBId: string, projectId: string, score: number) {
    const [sortedA, sortedB] = [userAId, userBId].sort();

    const existing = await this.prisma.collaborationPair.findUnique({
      where: { userAId_userBId: { userAId: sortedA, userBId: sortedB } },
    });

    if (existing) {
      const newCount = existing.projectsCount + 1;
      const newAvg = ((existing.averageScore * existing.projectsCount) + score) / newCount;
      const tags = this.computeCompatibilityTags(existing.compatibilityTags as string[] ?? [], score);

      return this.prisma.collaborationPair.update({
        where: { id: existing.id },
        data: {
          projectsCount: newCount,
          averageScore: Math.round(newAvg * 100) / 100,
          lastCollaborated: new Date(),
          compatibilityTags: tags,
        },
      });
    }

    return this.prisma.collaborationPair.create({
      data: {
        userAId: sortedA,
        userBId: sortedB,
        projectsCount: 1,
        averageScore: score,
        lastCollaborated: new Date(),
        compatibilityTags: this.computeCompatibilityTags([], score),
      },
    });
  }

  private async updateReputationScore(userId: string) {
    const reviews = await this.prisma.review.findMany({ where: { targetId: userId } });
    const contributions = await this.prisma.contribution.findMany({ where: { userId } });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 20 // 1-5 → 0-100
      : 0;

    const totalImpact = contributions.reduce((sum, c) => sum + c.impactScore, 0);
    const completionRate = await this.calculateCompletionRate(userId);

    const score = Math.round(
      (avgRating * 0.4) +
      (totalImpact * 0.3) +
      (completionRate * 0.3)
    );

    await this.prisma.profile.update({
      where: { userId },
      data: { reputationScore: Math.min(score, 100) },
    });
  }

  private async calculateCompletionRate(userId: string): Promise<number> {
    const totalTasks = await this.prisma.task.count({
      where: { assigneeId: userId },
    });
    if (totalTasks === 0) return 0;

    const doneTasks = await this.prisma.task.count({
      where: { assigneeId: userId, status: 'DONE' },
    });
    return Math.round((doneTasks / totalTasks) * 100) / 100;
  }

  private calculateImpactScore(linesOfCode: number, commits: number, tasksDone: number): number {
    const locScore = Math.min(linesOfCode / 1000, 1) * 40;
    const commitScore = Math.min(commits / 50, 1) * 30;
    const taskScore = Math.min(tasksDone / 10, 1) * 30;
    return Math.round((locScore + commitScore + taskScore) * 100) / 100;
  }

  private computeCompatibilityTags(existing: string[], newScore: number): string[] {
    const tags = new Set(existing);
    if (newScore >= 80) tags.add('high_performer');
    if (newScore >= 60) tags.add('reliable');
    if (newScore < 40) tags.delete('high_performer');
    return Array.from(tags);
  }
}
