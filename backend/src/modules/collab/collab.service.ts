import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name);

  constructor(private prisma: PrismaService) {}

  async createRoom(name: string, userId: string, projectId?: string, matchId?: string) {
    const room = await this.prisma.collabRoom.create({
      data: {
        name,
        projectId,
        matchId,
        participants: { create: { userId } },
      },
      include: { participants: { include: { user: { include: { profile: true } } } } },
    });
    return room;
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.prisma.collabRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) throw new NotFoundException('Room not found or inactive');

    const existing = await this.prisma.collabRoomParticipant.findUnique({
      where: { id: `${roomId}_${userId}` as unknown as string },
    });

    if (!existing) {
      await this.prisma.collabRoomParticipant.create({
        data: { roomId, userId },
      });
    }

    return this.prisma.collabRoom.findUnique({
      where: { id: roomId },
      include: { participants: { include: { user: { include: { profile: true } } } } },
    });
  }

  async leaveRoom(roomId: string, userId: string) {
    const participant = await this.prisma.collabRoomParticipant.findFirst({
      where: { roomId, userId, leftAt: null },
    });
    if (participant) {
      await this.prisma.collabRoomParticipant.update({
        where: { id: participant.id },
        data: { leftAt: new Date() },
      });
    }

    const activeCount = await this.prisma.collabRoomParticipant.count({
      where: { roomId, leftAt: null },
    });
    if (activeCount === 0) {
      await this.prisma.collabRoom.update({
        where: { id: roomId },
        data: { isActive: false, endedAt: new Date() },
      });
    }
    return { success: true };
  }

  async endRoom(roomId: string, userId: string) {
    const room = await this.prisma.collabRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const participant = await this.prisma.collabRoomParticipant.findFirst({
      where: { roomId, userId, leftAt: null },
    });
    if (!participant) throw new ForbiddenException('Not a participant in this room');

    await this.prisma.collabRoom.update({
      where: { id: roomId },
      data: { isActive: false, endedAt: new Date() },
    });

    await this.prisma.collabRoomParticipant.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: new Date() },
    });
    return { success: true };
  }

  listActiveRooms(userId: string, limit = 50, cursor?: string) {
    return this.prisma.collabRoom.findMany({
      where: { isActive: true, participants: { some: { userId, leftAt: null } } },
      include: { participants: { include: { user: { include: { profile: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  getRoom(roomId: string) {
    return this.prisma.collabRoom.findUnique({
      where: { id: roomId },
      include: { participants: { include: { user: { include: { profile: true } } } }, recordings: true },
    });
  }
}
