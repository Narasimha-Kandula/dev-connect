import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, targetType: string, targetId: string, reason: string) {
    return this.prisma.report.create({
      data: { reporterId, targetType, targetId, reason, status: 'pending' },
    });
  }

  listUsers(page = 1, pageSize = 25) {
    return this.prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { profile: true, _count: { select: { sessions: true, matchesAsUserOne: true, matchesAsUserTwo: true } } },
    });
  }

  suspendUser(id: string, moderatorId: string, reason?: string) {
    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isSuspended: true } }),
      this.prisma.moderationAction.create({
        data: { moderatorId, targetType: 'user', targetId: id, action: 'suspend', reason },
      }),
    ]);
  }

  banUser(id: string, moderatorId: string, reason?: string) {
    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isBanned: true } }),
      this.prisma.moderationAction.create({
        data: { moderatorId, targetType: 'user', targetId: id, action: 'ban', reason },
      }),
    ]);
  }

  reinstateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false, isBanned: false },
    });
  }

  listReports(status?: string) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { include: { profile: true } } },
    });
  }

  resolveReport(id: string, status: 'reviewed' | 'actioned' | 'dismissed') {
    return this.prisma.report.update({ where: { id }, data: { status } });
  }

  async getAnalyticsSummary() {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          total_users: number;
          total_matches: number;
          total_projects: number;
          total_messages: number;
          active_today: number;
        }>
      >`
        SELECT
          (SELECT COUNT(*) FROM users)::int AS total_users,
          (SELECT COUNT(*) FROM matches)::int AS total_matches,
          (SELECT COUNT(*) FROM projects)::int AS total_projects,
          (SELECT COUNT(*) FROM messages)::int AS total_messages,
          (SELECT COUNT(*) FROM users WHERE last_login_at >= NOW() - INTERVAL '24 hours')::int AS active_today
      `;
      return {
        totalUsers: Number(rows[0]?.total_users ?? 0),
        totalMatches: Number(rows[0]?.total_matches ?? 0),
        totalProjects: Number(rows[0]?.total_projects ?? 0),
        totalMessages: Number(rows[0]?.total_messages ?? 0),
        activeToday: Number(rows[0]?.active_today ?? 0),
      };
    } catch (e) {
      this.logger.warn(`Analytics query failed: ${(e as Error).message}`);
      return { totalUsers: 0, totalMatches: 0, totalProjects: 0, totalMessages: 0, activeToday: 0 };
    }
  }

  async getDetailedAnalytics() {
    try {
      const rows = await this.prisma.$queryRaw<Array<{
        date: string;
        new_users: number;
        new_matches: number;
        new_projects: number;
        new_messages: number;
      }>>`
        SELECT
          d::date AS date,
          COALESCE(u.cnt, 0) AS new_users,
          COALESCE(m.cnt, 0) AS new_matches,
          COALESCE(p.cnt, 0) AS new_projects,
          COALESCE(msg.cnt, 0) AS new_messages
        FROM generate_series(NOW() - INTERVAL '30 days', NOW(), '1 day') d
        LEFT JOIN (SELECT DATE(created_at) dt, COUNT(*) cnt FROM users GROUP BY dt) u ON u.dt = d::date
        LEFT JOIN (SELECT DATE(created_at) dt, COUNT(*) cnt FROM matches GROUP BY dt) m ON m.dt = d::date
        LEFT JOIN (SELECT DATE(created_at) dt, COUNT(*) cnt FROM projects GROUP BY dt) p ON p.dt = d::date
        LEFT JOIN (SELECT DATE(created_at) dt, COUNT(*) cnt FROM messages GROUP BY dt) msg ON msg.dt = d::date
        ORDER BY d
      `;
      return rows;
    } catch (e) {
      this.logger.warn(`Detailed analytics query failed: ${(e as Error).message}`);
      return [];
    }
  }

  getAuditLogs(page = 1, pageSize = 50) {
    return this.prisma.auditLog.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { profile: true } } },
    });
  }
}
