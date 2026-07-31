import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async listConversations(userId: string, cursor?: string) {
    return this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async createOrGetConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot start a conversation with yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      const duplicates = await tx.conversation.findMany({
        where: {
          isGroup: false,
          matchId: null,
          projectId: null,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: targetUserId } } },
          ],
        },
        include: {
          members: { include: { user: { include: { profile: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, where: { deletedAt: null } },
        },
      });

      if (duplicates.length > 0) {
        const keep = duplicates[0];
        for (const dup of duplicates.slice(1)) {
          await tx.message.updateMany({ where: { conversationId: dup.id }, data: { conversationId: keep.id } });
          await tx.conversationMember.deleteMany({ where: { conversationId: dup.id } });
          await tx.conversation.delete({ where: { id: dup.id } });
        }
        return keep;
      }

      return tx.conversation.create({
        data: {
          isGroup: false,
          members: { create: [{ userId }, { userId: targetUserId }] },
        },
        include: {
          members: { include: { user: { include: { profile: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, where: { deletedAt: null } },
        },
      });
    });
  }

  private async assertMember(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this conversation');
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return !!member;
  }

  async getMessages(conversationId: string, userId: string, cursor?: string) {
    await this.assertMember(conversationId, userId);
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { reactions: true, sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string, attachments?: { url: string; type: string; name: string }[]) {
    await this.assertMember(conversationId, senderId);
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        attachments: attachments ?? undefined,
        status: 'SENT',
      },
      include: { sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } }, reactions: true },
    });
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      data: { lastReadAt: new Date() },
    });
    return message;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot edit another user\'s message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      include: { sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } }, reactions: true },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot delete another user\'s message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) throw new NotFoundException('Message not found');

    return this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      update: {},
      create: { messageId, userId, emoji },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const reaction = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (!reaction) throw new NotFoundException('Reaction not found');
    await this.prisma.messageReaction.delete({ where: { id: reaction.id } });
    return { success: true };
  }

  async getMessageById(messageId: string) {
    return this.prisma.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    return this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  async createGroup(name: string | undefined, creatorId: string, memberIds: string[]) {
    const allIds = [...new Set([creatorId, ...memberIds])];
    return this.prisma.conversation.create({
      data: {
        isGroup: true,
        name: name?.trim() || null,
        members: { create: allIds.map((userId) => ({ userId })) },
      },
      include: { members: { include: { user: { include: { profile: true } } } } },
    });
  }

  async addMembers(conversationId: string, requesterId: string, newMemberIds: string[]) {
    await this.assertMember(conversationId, requesterId);
    const existing = await this.prisma.conversationMember.findMany({
      where: { conversationId, userId: { in: newMemberIds } },
    });
    const alreadyMembers = new Set(existing.map((m) => m.userId));
    const toAdd = newMemberIds.filter((id) => !alreadyMembers.has(id));
    if (toAdd.length === 0) {
      return this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: { include: { user: { include: { profile: true } } } } },
      });
    }
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isGroup: true },
    });
    await this.prisma.conversationMember.createMany({
      data: toAdd.map((userId) => ({ conversationId, userId })),
    });
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { include: { user: { include: { profile: true } } } } },
    });
  }

  async deleteConversation(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await this.prisma.message.deleteMany({ where: { conversationId } });
    await this.prisma.conversationMember.deleteMany({ where: { conversationId } });
    return this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  async getConversationMembers(conversationId: string) {
    return this.prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });
  }

  async getUndeliveredMessages(userId: string) {
    return this.prisma.message.findMany({
      where: {
        senderId: { not: userId },
        status: 'SENT',
        conversation: { members: { some: { userId } } },
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } }, reactions: true },
      take: 100,
    });
  }

  async markDelivered(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
  }
}
