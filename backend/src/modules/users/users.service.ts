import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { expandSkillNames } from '../../common/utils/skill-expansion';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

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
    const { passwordHash: _passwordHash, emailVerificationToken: _emailVerificationToken, mfaSecret: _mfaSecret, ...rest } = user;
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
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

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
    this.searchService.indexUser(userId).catch(() => {});
    return updated;
  }

  async setSkills(userId: string, skillNames: { name: string; proficiency?: number }[]) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });

    await this.prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });

    const expanded: { name: string; proficiency?: number }[] = [];
    for (const s of skillNames) {
      const names = expandSkillNames([s.name]);
      for (const name of names) {
        if (!expanded.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
          expanded.push({ name, proficiency: s.proficiency });
        }
      }
    }

    const skillIds: string[] = [];
    for (const s of expanded) {
      const skill = await this.prisma.skill.upsert({
        where: { name: s.name },
        update: {},
        create: { name: s.name },
      });
      skillIds.push(skill.id);
    }

    if (skillIds.length > 0) {
      await this.prisma.profileSkill.createMany({
        data: skillIds.map((skillId, i) => ({
          profileId: profile.id,
          skillId,
          proficiency: skillNames[i].proficiency ?? 3,
        })),
        skipDuplicates: true,
      });
    }

    const skillCount = expanded.length;
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

  async searchProfiles(query: string, limit = 20, offset = 0, cursor?: string, sort?: string) {
    const result = await this.searchService.search(query, {
      limit: Math.min(limit, 50),
      offset,
      sort,
    });

    return {
      hits: result.hits,
      total: result.total,
    };
  }

  async syncGitHub(userId: string, username: string) {
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
      throw new NotFoundException('Invalid GitHub username format.');
    }
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('GitHub user not found');
      const data = await res.json();

      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=50`);
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

  async uploadAvatar(userId: string, filename: string): Promise<{ avatarUrl: string }> {
    const avatarUrl = `/uploads/${filename}`;
    await this.prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, displayName: 'Developer', avatarUrl },
    });
    return { avatarUrl };
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

  async blockUser(userId: string, targetId: string) {
    if (userId === targetId) throw new ConflictException('You cannot block yourself');
    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    });
    if (existing) throw new ConflictException('User is already blocked');
    return this.prisma.blockedUser.create({
      data: { blockerId: userId, blockedId: targetId },
    });
  }

  async unblockUser(userId: string, targetId: string) {
    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    });
    if (!existing) throw new NotFoundException('Block not found');
    return this.prisma.blockedUser.delete({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    });
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: { blocked: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveProfile(userId: string, targetId: string) {
    if (userId === targetId) throw new ConflictException('You cannot save your own profile');
    const existing = await this.prisma.savedProfile.findUnique({
      where: { userId_savedUserId: { userId, savedUserId: targetId } },
    });
    if (existing) return existing;
    return this.prisma.savedProfile.create({
      data: { userId, savedUserId: targetId },
    });
  }

  async unsaveProfile(userId: string, targetId: string) {
    const existing = await this.prisma.savedProfile.findUnique({
      where: { userId_savedUserId: { userId, savedUserId: targetId } },
    });
    if (!existing) throw new NotFoundException('Saved profile not found');
    return this.prisma.savedProfile.delete({
      where: { userId_savedUserId: { userId, savedUserId: targetId } },
    });
  }

  async getSavedProfiles(userId: string) {
    return this.prisma.savedProfile.findMany({
      where: { userId },
      include: { savedUser: { include: { profile: { include: { skills: { include: { skill: true } } } } } } },
      orderBy: { createdAt: 'desc' },
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
