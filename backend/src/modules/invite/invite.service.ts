import { Injectable, BadRequestException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async send(senderId: string, receiverId: string, message?: string) {
    if (senderId === receiverId) throw new BadRequestException('Cannot invite yourself');

    const existing = await this.prisma.invitation.findFirst({
      where: { senderId, receiverId, status: 'PENDING' },
    });
    if (existing) throw new BadRequestException('You already have a pending invitation to this user');

    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (blocked) throw new BadRequestException('Cannot send invitation');

    const invitation = await this.prisma.invitation.create({
      data: { senderId, receiverId, message, status: 'PENDING' },
      include: {
        sender: { include: { profile: true } },
      },
    });

    this.notifications.create(
      receiverId,
      'INVITATION',
      'New collaboration request',
      `${invitation.sender.profile?.displayName ?? 'Someone'} wants to collaborate with you`,
      { invitationId: invitation.id, senderId },
    ).catch((e) => this.logger.error(`Invite notification failed: ${(e as Error).message}`));

    return invitation;
  }

  async respond(invitationId: string, userId: string, action: 'ACCEPTED' | 'REJECTED') {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { sender: { include: { profile: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.receiverId !== userId) throw new ForbiddenException('Not your invitation');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation already responded');

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: action, respondedAt: new Date() },
    });

    if (action === 'ACCEPTED') {
      const [userAId, userBId] = [invitation.senderId, invitation.receiverId].sort();
      const match = await this.prisma.match.upsert({
        where: { userOneId_userTwoId: { userOneId: userAId, userTwoId: userBId } },
        update: {},
        create: { userOneId: userAId, userTwoId: userBId },
      });

      await this.prisma.conversation.upsert({
        where: { matchId: match.id },
        update: {},
        create: {
          matchId: match.id,
          members: { create: [{ userId: userAId }, { userId: userBId }] },
        },
      });
    }

    this.notifications.create(
      invitation.senderId,
      'INVITATION',
      action === 'ACCEPTED' ? 'Collaboration request accepted' : 'Collaboration request declined',
      action === 'ACCEPTED'
        ? 'Start collaborating now!'
        : `${invitation.sender.profile?.displayName ?? 'The user'} declined your request.`,
      { invitationId: updated.id, status: action },
    ).catch((e) => this.logger.error(`Response notification failed: ${(e as Error).message}`));

    return updated;
  }

  listReceived(userId: string, status?: InvitationStatus) {
    return this.prisma.invitation.findMany({
      where: { receiverId: userId, ...(status ? { status } : {}) },
      include: {
        sender: { include: { profile: { select: { displayName: true, headline: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listSent(userId: string) {
    return this.prisma.invitation.findMany({
      where: { senderId: userId },
      include: {
        receiver: { include: { profile: { select: { displayName: true, headline: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
