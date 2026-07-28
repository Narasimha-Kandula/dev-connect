import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        endorsements: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { skills: { include: { skill: true } }, endorsements: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, emailVerificationToken, mfaSecret, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: Record<string, unknown> = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.headline !== undefined) updateData.headline = dto.headline;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.githubUsername !== undefined) updateData.githubUsername = dto.githubUsername;
    if (dto.portfolioLinks !== undefined) updateData.portfolioLinks = dto.portfolioLinks;
    if (dto.availability !== undefined) updateData.availability = dto.availability;
    if (dto.preferences !== undefined) updateData.preferences = dto.preferences as Prisma.InputJsonValue;

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: updateData as never,
      create: { userId, displayName: dto.displayName ?? 'Developer', ...updateData } as never,
      include: { skills: { include: { skill: true } } },
    }) as unknown as Prisma.ProfileGetPayload<{ include: { skills: { include: { skill: true } } } }>;

    const skillCount = profile.skills.length;
    const completeness = this.calculateCompleteness(profile, skillCount);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { profileCompleteness: completeness },
      include: { skills: { include: { skill: true } } },
    }) as unknown as Prisma.ProfileGetPayload<{ include: { skills: { include: { skill: true } } } }>;

    await this.recalculateReputation(userId);
    return updated;
  }

  async setSkills(userId: string, skillNames: { name: string; proficiency?: number }[]) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });

    await this.prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });

    for (const s of skillNames) {
      const skill = await this.prisma.skill.upsert({
        where: { name: s.name },
        update: {},
        create: { name: s.name },
      });
      await this.prisma.profileSkill.create({
        data: { profileId: profile.id, skillId: skill.id, proficiency: s.proficiency ?? 3 },
      });
    }

    const skillCount = skillNames.length;
    const completeness = this.calculateCompleteness(
      await this.prisma.profile.findUniqueOrThrow({ where: { userId } }),
      skillCount,
    );
    await this.prisma.profile.update({
      where: { userId },
      data: { profileCompleteness: completeness },
    });

    await this.recalculateReputation(userId);
    return this.getPublicProfile(userId);
  }

  async endorseSkill(targetUserId: string, endorserId: string, skill?: string, message?: string) {
    if (targetUserId === endorserId) throw new ConflictException('You cannot endorse yourself');

    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId: targetUserId } });

    const existing = await this.prisma.endorsement.findUnique({
      where: { profileId_endorserId: { profileId: profile.id, endorserId } },
    });
    if (existing) throw new ConflictException('You have already endorsed this profile');

    const endorsement = await this.prisma.endorsement.create({
      data: { profileId: profile.id, endorserId, skill, message },
    });

    await this.recalculateReputation(targetUserId);
    return endorsement;
  }

  async searchProfiles(query: string, limit = 20, offset = 0) {
    if (!query || query.length < 2) {
      return this.prisma.profile.findMany({
        where: { isPublic: true },
        include: { skills: { include: { skill: true } }, user: { select: { id: true } } },
        take: limit,
        skip: offset,
        orderBy: { reputationScore: 'desc' },
      });
    }

    return this.prisma.profile.findMany({
      where: {
        isPublic: true,
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { headline: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
        ],
      },
      include: { skills: { include: { skill: true } }, user: { select: { id: true } } },
      take: limit,
      skip: offset,
      orderBy: { reputationScore: 'desc' },
    });
  }

  async syncGitHub(userId: string, username: string) {
    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) throw new Error('GitHub user not found');
      const data = await res.json();

      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=50`);
      const repos = reposRes.ok ? await reposRes.json() : [];

      const totalStars = repos.reduce((sum: number, r: { stargazers_count?: number }) => sum + (r.stargazers_count ?? 0), 0);

      await this.prisma.profile.update({
        where: { userId },
        data: {
          githubUsername: username,
          githubData: {
            publicRepos: data.public_repos,
            followers: data.followers,
            totalStars,
            avatarUrl: data.avatar_url,
            bio: data.bio,
          },
        },
      });

      await this.recalculateReputation(userId);
      return this.getPublicProfile(userId);
    } catch (e) {
      this.logger.error(`GitHub sync failed for ${username}: ${(e as Error).message}`);
      throw new NotFoundException('GitHub sync failed. Check the username and try again.');
    }
  }

  private async recalculateReputation(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { skills: true, endorsements: true },
    });
    if (!profile) return;

    let score = 0;
    score += Math.min((profile.githubData as { totalStars?: number })?.totalStars ?? 0, 50);
    score += profile.endorsements.length * 10;
    score += Math.min(profile.skills.length * 5, 25);
    score += Math.min(profile.profileCompleteness, 15);

    await this.prisma.profile.update({
      where: { userId },
      data: { reputationScore: score },
    });
  }

  private calculateCompleteness(profile: { displayName?: string | null; headline?: string | null; bio?: string | null; preferences?: unknown }, skillCount = 0): number {
    const TOTAL = 5;
    let filled = 0;

    if (profile.displayName?.trim()) filled++;
    if (profile.headline?.trim()) filled++;
    if (profile.bio?.trim()) filled++;
    if (skillCount > 0) filled++;
    if (profile.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences) && Object.keys(profile.preferences as Record<string, unknown>).length > 0) filled++;

    return Math.round((filled / TOTAL) * 100);
  }
}
