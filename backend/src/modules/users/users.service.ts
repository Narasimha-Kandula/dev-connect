import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { skills: { include: { skill: true } } } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: { ...dto, availability: dto.availability as never },
    });

    const completeness = this.calculateCompleteness(profile);
    return this.prisma.profile.update({
      where: { userId },
      data: { profileCompleteness: completeness },
    });
  }

  async setSkills(userId: string, skillNames: string[]) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });

    await this.prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });

    for (const name of skillNames) {
      const skill = await this.prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await this.prisma.profileSkill.create({
        data: { profileId: profile.id, skillId: skill.id },
      });
    }

    return this.getPublicProfile(userId);
  }

  private calculateCompleteness(profile: {
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    githubUsername?: string | null;
  }): number {
    const fields = [profile.displayName, profile.headline, profile.bio, profile.avatarUrl, profile.githubUsername];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }
}
