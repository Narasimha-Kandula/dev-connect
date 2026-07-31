import { ChatService } from '../../src/modules/chat/chat.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let mockPrisma: any;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      conversation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockPrisma = {
      conversation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      conversationMember: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      messageReaction: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
    };

    service = new ChatService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function mockConversation(overrides: Record<string, unknown> = {}) {
    return {
      id: 'conv-1',
      isGroup: false,
      matchId: null,
      projectId: null,
      createdAt: new Date(),
      members: [
        { userId: 'user-1', user: { id: 'user-1', profile: { displayName: 'Alice' } } },
        { userId: 'user-2', user: { id: 'user-2', profile: { displayName: 'Bob' } } },
      ],
      messages: [],
      ...overrides,
    };
  }

  function mockMessage(overrides: Record<string, unknown> = {}) {
    return {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      status: 'SENT',
      editedAt: null,
      deletedAt: null,
      attachments: null,
      sender: { id: 'user-1', profile: { displayName: 'Alice', avatarUrl: null } },
      reactions: [],
      ...overrides,
    };
  }

  function mockMember(overrides: Record<string, unknown> = {}) {
    return {
      conversationId: 'conv-1',
      userId: 'user-1',
      lastReadAt: new Date(),
      ...overrides,
    };
  }

  function mockReaction(overrides: Record<string, unknown> = {}) {
    return {
      id: 'reaction-1',
      messageId: 'msg-1',
      userId: 'user-1',
      emoji: '👍',
      ...overrides,
    };
  }

  describe('listConversations', () => {
    it('should return conversations with member and message includes', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([mockConversation()]);

      const result = await service.listConversations('user-1');

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { members: { some: { userId: 'user-1' } } },
          include: expect.objectContaining({
            members: expect.any(Object),
            messages: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should use cursor-based pagination when cursor is provided', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      await service.listConversations('user-1', 'cursor-1');

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'cursor-1' },
          skip: 1,
        }),
      );
    });
  });

  describe('createOrGetConversation', () => {
    it('should return existing conversation if one exists', async () => {
      const conv = mockConversation();
      mockTx.conversation.findMany.mockResolvedValue([conv]);

      const result = await service.createOrGetConversation('user-1', 'user-2');

      expect(result).toEqual(conv);
      expect(mockTx.conversation.create).not.toHaveBeenCalled();
      expect(mockTx.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isGroup: false,
            matchId: null,
            projectId: null,
            AND: [
              { members: { some: { userId: 'user-1' } } },
              { members: { some: { userId: 'user-2' } } },
            ],
          }),
        }),
      );
    });

    it('should create a new conversation when none exists', async () => {
      mockTx.conversation.findMany.mockResolvedValue([]);
      mockTx.conversation.create.mockResolvedValue(mockConversation());

      const result = await service.createOrGetConversation('user-1', 'user-2');

      expect(mockTx.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isGroup: false,
            members: { create: [{ userId: 'user-1' }, { userId: 'user-2' }] },
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should double-check inside transaction and return existing', async () => {
      const conv = mockConversation({ id: 'existing-conv' });
      mockTx.conversation.findMany.mockResolvedValue([conv]);

      const result = await service.createOrGetConversation('user-1', 'user-2');

      expect(mockTx.conversation.findMany).toHaveBeenCalledTimes(1);
      expect(mockTx.conversation.create).not.toHaveBeenCalled();
      expect(result).toEqual(conv);
    });

    it('should merge duplicate conversations and delete extras', async () => {
      const keep = mockConversation({ id: 'keep-conv' });
      const dup = mockConversation({ id: 'dup-conv' });
      mockTx.conversation.findMany.mockResolvedValue([keep, dup]);
      mockTx.message = { updateMany: jest.fn().mockResolvedValue({ count: 1 }) };
      mockTx.conversationMember = { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) };
      mockTx.conversation.delete = jest.fn().mockResolvedValue(dup);

      const result = await service.createOrGetConversation('user-1', 'user-2');

      expect(mockTx.message.updateMany).toHaveBeenCalledWith({
        where: { conversationId: 'dup-conv' },
        data: { conversationId: 'keep-conv' },
      });
      expect(mockTx.conversationMember.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'dup-conv' },
      });
      expect(mockTx.conversation.delete).toHaveBeenCalledWith({ where: { id: 'dup-conv' } });
      expect(result).toEqual(keep);
    });

    it('should throw ForbiddenException for self-conversation', async () => {
      await expect(service.createOrGetConversation('user-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should create message and update lastReadAt', async () => {
      mockPrisma.conversationMember.findUnique.mockResolvedValue(mockMember());
      mockPrisma.message.create.mockResolvedValue(mockMessage());

      const result = await service.sendMessage('conv-1', 'user-1', 'Hello');

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-1',
            senderId: 'user-1',
            content: 'Hello',
            status: 'SENT',
          }),
        }),
      );
      expect(mockPrisma.conversationMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: 'conv-1', userId: 'user-1' } },
          data: { lastReadAt: expect.any(Date) },
        }),
      );
      expect(result).toMatchObject(mockMessage());
    });

    it('should handle attachments', async () => {
      mockPrisma.conversationMember.findUnique.mockResolvedValue(mockMember());
      mockPrisma.message.create.mockResolvedValue(mockMessage());

      await service.sendMessage('conv-1', 'user-1', 'Check this', [
        { url: 'https://example.com/file.pdf', type: 'application/pdf', name: 'doc.pdf' },
      ]);

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachments: [{ url: 'https://example.com/file.pdf', type: 'application/pdf', name: 'doc.pdf' }],
          }),
        }),
      );
    });

    it('should throw ForbiddenException for non-members', async () => {
      mockPrisma.conversationMember.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage('conv-1', 'user-3', 'Hello')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe('editMessage', () => {
    it('should edit own message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage());
      mockPrisma.message.update.mockResolvedValue(mockMessage({ content: 'Updated', editedAt: new Date() }));

      const result = await service.editMessage('msg-1', 'user-1', 'Updated');

      expect(mockPrisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-1' },
          data: expect.objectContaining({ content: 'Updated', editedAt: expect.any(Date) }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when editing another user\'s message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage({ senderId: 'user-2' }));

      await expect(service.editMessage('msg-1', 'user-1', 'Hacked')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException for non-existent message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      await expect(service.editMessage('msg-99', 'user-1', 'Content')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for deleted message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage({ deletedAt: new Date() }));

      await expect(service.editMessage('msg-1', 'user-1', 'Content')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteMessage', () => {
    it('should soft-delete own message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage());
      mockPrisma.message.update.mockResolvedValue(mockMessage({ deletedAt: new Date(), content: null }));

      const result = await service.deleteMessage('msg-1', 'user-1');

      expect(mockPrisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date), content: null }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for already-deleted message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage({ deletedAt: new Date() }));

      await expect(service.deleteMessage('msg-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for another user\'s message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage({ senderId: 'user-2' }));

      await expect(service.deleteMessage('msg-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addReaction', () => {
    it('should upsert a reaction', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage());
      mockPrisma.messageReaction.upsert.mockResolvedValue(mockReaction());

      const result = await service.addReaction('msg-1', 'user-1', '👍');

      expect(mockPrisma.messageReaction.upsert).toHaveBeenCalledWith({
        where: { messageId_userId_emoji: { messageId: 'msg-1', userId: 'user-1', emoji: '👍' } },
        update: {},
        create: { messageId: 'msg-1', userId: 'user-1', emoji: '👍' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      await expect(service.addReaction('msg-99', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for deleted message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage({ deletedAt: new Date() }));

      await expect(service.addReaction('msg-1', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeReaction', () => {
    it('should delete an existing reaction', async () => {
      mockPrisma.messageReaction.findUnique.mockResolvedValue(mockReaction());
      mockPrisma.messageReaction.delete.mockResolvedValue(mockReaction());

      const result = await service.removeReaction('msg-1', 'user-1', '👍');

      expect(mockPrisma.messageReaction.delete).toHaveBeenCalledWith({
        where: { id: 'reaction-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException for non-existent reaction', async () => {
      mockPrisma.messageReaction.findUnique.mockResolvedValue(null);

      await expect(service.removeReaction('msg-1', 'user-1', '👍')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markRead', () => {
    it('should update lastReadAt for a member', async () => {
      mockPrisma.conversationMember.findUnique.mockResolvedValue(mockMember());
      mockPrisma.conversationMember.update.mockResolvedValue(mockMember({ lastReadAt: new Date() }));

      const result = await service.markRead('conv-1', 'user-1');

      expect(mockPrisma.conversationMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: 'conv-1', userId: 'user-1' } },
          data: { lastReadAt: expect.any(Date) },
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for non-members', async () => {
      mockPrisma.conversationMember.findUnique.mockResolvedValue(null);

      await expect(service.markRead('conv-1', 'user-3')).rejects.toThrow(ForbiddenException);
    });
  });
});
