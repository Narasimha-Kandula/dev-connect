import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getAiInsights(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        user: {
          select: {
            projectsOwned: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!profile) return null;

    const skillNames = profile.skills.map((s) => s.skill.name);
    const projectCount = profile.user.projectsOwned.length;

    const recommendedSkills = this.getRecommendedSkills(skillNames);
    const suggestedRoles = this.getSuggestedRoles(skillNames);
    const matchSuggestions = await this.getMatchSuggestions(userId, skillNames);

    return {
      profileStrength: Math.min(profile.skills.length * 15 + projectCount * 10 + profile.reputationScore, 100),
      topSkills: skillNames.slice(0, 5),
      recommendedSkills,
      suggestedRoles,
      matchSuggestions,
      projectCount,
    };
  }

  async getRecommendations(userId: string, limit = 10) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) return [];

    const mySkillIds = profile.skills.map((s) => s.skillId);

    const similar = await this.prisma.profile.findMany({
      where: {
        isPublic: true,
        userId: { not: userId },
        skills: { some: { skillId: { in: mySkillIds } } },
      },
      include: {
        skills: { include: { skill: true } },
        user: { select: { id: true } },
      },
      take: limit,
      orderBy: { reputationScore: 'desc' },
    });

    const scored = similar.map((p) => {
      const theirSkillIds = p.skills.map((s) => s.skillId);
      const overlap = mySkillIds.filter((id) => theirSkillIds.includes(id)).length;
      const union = new Set([...mySkillIds, ...theirSkillIds]).size;
      const skillScore = union > 0 ? overlap / union : 0;
      const totalScore = skillScore * 0.6 + (p.reputationScore / 100) * 0.4;
      return { ...p, matchScore: Math.round(totalScore * 100) / 100 };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  }

  async getRecommendedProjects(userId: string, limit = 6) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) return [];

    const mySkillNames = profile.skills.map((s) => s.skill.name);

    const projects = await this.prisma.project.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        OR: mySkillNames.map((name) => ({ requiredSkills: { array_contains: name } as never })),
      },
      include: { owner: { include: { profile: true } }, _count: { select: { members: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  private getRecommendedSkills(currentSkills: string[]): string[] {
    const skillGraph: Record<string, string[]> = {
      'React': ['TypeScript', 'Next.js', 'GraphQL', 'React Native'],
      'TypeScript': ['React', 'Next.js', 'NestJS', 'Node.js'],
      'Node.js': ['NestJS', 'TypeScript', 'PostgreSQL', 'GraphQL'],
      'Python': ['Django', 'TensorFlow', 'AI/ML', 'FastAPI'],
      'PostgreSQL': ['MongoDB', 'Docker', 'GraphQL', 'Redis'],
      'Docker': ['Kubernetes', 'AWS', 'CI/CD'],
    };

    const recommended = new Set<string>();
    for (const skill of currentSkills) {
      const related = skillGraph[skill] ?? [];
      for (const r of related) {
        if (!currentSkills.includes(r)) recommended.add(r);
      }
    }
    return Array.from(recommended).slice(0, 5);
  }

  private getSuggestedRoles(skills: string[]): string[] {
    const roles: string[] = [];
    if (skills.some((s) => ['React', 'Next.js', 'TypeScript', 'Vue'].includes(s))) roles.push('Frontend Developer');
    if (skills.some((s) => ['Node.js', 'NestJS', 'Python', 'Go', 'Rust'].includes(s))) roles.push('Backend Developer');
    if (skills.some((s) => ['Docker', 'Kubernetes', 'AWS', 'CI/CD'].includes(s))) roles.push('DevOps Engineer');
    if (skills.some((s) => ['AI/ML', 'TensorFlow', 'Python'].includes(s))) roles.push('ML Engineer');
    if (skills.some((s) => ['React Native', 'Flutter', 'Swift'].includes(s))) roles.push('Mobile Developer');
    if (roles.length === 0) roles.push('Full-Stack Developer');
    return roles;
  }

  private async getMatchSuggestions(userId: string, mySkills: string[]) {
    const matches = await this.prisma.profile.findMany({
      where: {
        isPublic: true,
        userId: { not: userId },
        skills: { some: { skill: { name: { in: mySkills } } } },
      },
      include: { skills: { include: { skill: true } } },
      take: 5,
      orderBy: { reputationScore: 'desc' },
    });

    return matches.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      headline: m.headline,
      skills: m.skills.map((s) => s.skill.name),
    }));
  }
}
