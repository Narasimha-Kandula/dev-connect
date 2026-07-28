import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

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
      include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } } },
    });
  }

  async update(projectId: string, userId: string, dto: Partial<CreateProjectDto>) {
    await this.assertOwner(projectId, userId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        requiredSkills: dto.requiredSkills as never,
      },
      include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } } },
    });
  }

  async delete(projectId: string, userId: string) {
    await this.assertOwner(projectId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  async list(filters: { skill?: string; status?: string; search?: string; limit?: number; offset?: number }) {
    const where: Record<string, unknown> = {};
    const statusFilter = filters.status ? filters.status : { in: ['OPEN', 'IN_PROGRESS'] };
    where.status = statusFilter;

    if (filters.skill) {
      where.requiredSkills = { array_contains: filters.skill } as never;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } }, _count: { select: { members: true, tasks: true } } },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    });
  }

  async getById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { include: { profile: true } },
        members: { include: { user: { include: { profile: true } } } },
        tasks: { orderBy: { createdAt: 'desc' } },
        milestones: { orderBy: { dueDate: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  async getMyProjects(userId: string, limit = 50, cursor?: string) {
    return this.prisma.project.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } } },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async requestToJoin(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const existing = await this.prisma.invitation.findFirst({
      where: { projectId, receiverId: project.ownerId, senderId: userId, status: 'PENDING' },
    });
    if (existing) throw new ForbiddenException('Join request already sent');

    return this.prisma.invitation.create({
      data: { senderId: userId, receiverId: project.ownerId, projectId, message: 'Requested to join the project' },
    });
  }

  async respondToInvitation(invitationId: string, userId: string, action: 'ACCEPTED' | 'REJECTED') {
    const invitation = await this.prisma.invitation.findUniqueOrThrow({ where: { id: invitationId } });
    if (invitation.receiverId !== userId) throw new ForbiddenException('Not authorized');

    if (action === 'ACCEPTED' && invitation.projectId) {
      await this.prisma.projectMember.create({
        data: { projectId: invitation.projectId, userId: invitation.senderId, role: 'CONTRIBUTOR' },
      });
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: action, respondedAt: new Date() },
    });
  }

  async addMember(projectId: string, requesterId: string, userId: string, role: 'CONTRIBUTOR' | 'VIEWER' = 'CONTRIBUTOR') {
    await this.assertOwner(projectId, requesterId);
    return this.prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  async removeMember(projectId: string, requesterId: string, userId: string) {
    await this.assertOwner(projectId, requesterId);
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove the project owner');
    await this.prisma.projectMember.delete({ where: { id: member.id } });
    return { success: true };
  }

  async createTask(projectId: string, userId: string, title: string, description?: string, assigneeId?: string, dueDate?: string) {
    await this.assertMember(projectId, userId);
    return this.prisma.task.create({
      data: { projectId, title, description, assigneeId, dueDate: dueDate ? new Date(dueDate) : undefined },
    });
  }

  async updateTaskStatus(taskId: string, userId: string, status: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertMember(task.projectId, userId);
    return this.prisma.task.update({ where: { id: taskId }, data: { status } });
  }

  addFile(projectId: string | undefined, uploaderId: string, fileName: string, fileUrl: string, fileType?: string, sizeBytes?: number) {
    return this.prisma.sharedFile.create({
      data: { projectId, uploaderId, fileName, fileUrl, fileType, sizeBytes },
    });
  }

  private async assertMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this project.');
  }

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    if (project.ownerId !== userId) throw new ForbiddenException('Only the project owner can perform this action.');
  }
}
