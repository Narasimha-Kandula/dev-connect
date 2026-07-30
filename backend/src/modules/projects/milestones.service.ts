import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, title: string, userId: string, description?: string, dueDate?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only the project owner can create milestones');
    return this.prisma.milestone.create({
      data: {
        projectId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });
  }

  list(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateStatus(id: string, status: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.project.ownerId !== userId) throw new ForbiddenException('Only the project owner can update milestones');
    return this.prisma.milestone.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.project.ownerId !== userId) throw new ForbiddenException('Only the project owner can delete milestones');
    return this.prisma.milestone.delete({ where: { id } });
  }
}
