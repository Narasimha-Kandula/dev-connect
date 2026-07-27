import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        requiredSkills: dto.requiredSkills,
        budget: dto.budget,
        timeline: dto.timeline,
        status: 'OPEN',
        members: { create: [{ userId: ownerId, role: 'OWNER' }] },
      },
    });
  }

  list(filters: { skill?: string }) {
    return this.prisma.project.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        ...(filters.skill
          ? { requiredSkills: { array_contains: filters.skill } as never }
          : {}),
      },
      include: { owner: { include: { profile: true } }, members: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { include: { profile: true } },
        members: { include: { user: { include: { profile: true } } } },
        tasks: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async requestToJoin(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    return this.prisma.invitation.create({
      data: {
        senderId: userId,
        receiverId: project.ownerId,
        projectId,
        message: 'Requested to join the project',
      },
    });
  }

  async addMember(projectId: string, requesterId: string, userId: string, role: 'CONTRIBUTOR' | 'VIEWER' = 'CONTRIBUTOR') {
    await this.assertOwner(projectId, requesterId);
    return this.prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    if (project.ownerId !== userId) throw new ForbiddenException('Only the owner can perform this action');
  }

  createTask(projectId: string, title: string, description?: string) {
    return this.prisma.task.create({ data: { projectId, title, description } });
  }

  updateTaskStatus(taskId: string, status: string) {
    return this.prisma.task.update({ where: { id: taskId }, data: { status } });
  }
}
