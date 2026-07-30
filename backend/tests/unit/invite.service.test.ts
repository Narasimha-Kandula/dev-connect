import { InviteService } from '../../src/modules/invite/invite.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('InviteService', () => {
  let service: InviteService;
  let mockPrisma: any;
  let mockNotifications: any;

  beforeEach(() => {
    mockNotifications = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      invitation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      blockedUser: {
        findFirst: jest.fn(),
      },
      match: {
        upsert: jest.fn(),
      },
      conversation: {
        upsert: jest.fn(),
      },
    };

    service = new InviteService(mockPrisma as any, mockNotifications as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function mockInvitation(overrides: Record<string, unknown> = {}) {
    return {
      id: 'invite-1',
      senderId: 'user-1',
      receiverId: 'user-2',
      status: 'PENDING',
      message: 'Lets collaborate!',
      respondedAt: null,
      sender: {
        id: 'user-1',
        profile: { displayName: 'Alice', headline: 'Developer', avatarUrl: null },
      },
      ...overrides,
    };
  }

  describe('send', () => {
    it('should create invitation and send notification', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.blockedUser.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation());

      const result = await service.send('user-1', 'user-2', 'Lets collaborate!');

      expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderId: 'user-1',
            receiverId: 'user-2',
            message: 'Lets collaborate!',
            status: 'PENDING',
          }),
        }),
      );
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-2',
        'INVITATION',
        'New collaboration request',
        expect.any(String),
        expect.objectContaining({ invitationId: 'invite-1', senderId: 'user-1' }),
      );
      expect(result).toMatchObject(mockInvitation());
    });

    it('should reject self-invite', async () => {
      await expect(service.send('user-1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.invitation.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate pending invitation', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(mockInvitation());

      await expect(service.send('user-1', 'user-2')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.invitation.create).not.toHaveBeenCalled();
    });

    it('should reject if blocked', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.blockedUser.findFirst.mockResolvedValue({ id: 'block-1', blockerId: 'user-2', blockedId: 'user-1' });

      await expect(service.send('user-1', 'user-2')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.invitation.create).not.toHaveBeenCalled();
    });

    it('should send invitation without optional message', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.blockedUser.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation({ message: null }));

      await service.send('user-1', 'user-2');

      expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ message: undefined }),
        }),
      );
    });

    it('should not throw when notification creation fails', async () => {
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.blockedUser.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation());
      mockNotifications.create.mockRejectedValue(new Error('Notification service down'));

      const result = await service.send('user-1', 'user-2');

      expect(result).toMatchObject(mockInvitation());
    });
  });

  describe('respond', () => {
    it('should accept invitation, create match and conversation', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation({ id: 'invite-1', status: 'PENDING' }));
      mockPrisma.invitation.update.mockResolvedValue(mockInvitation({ status: 'ACCEPTED', respondedAt: new Date() }));
      mockPrisma.match.upsert.mockResolvedValue({ id: 'match-1', userOneId: 'user-1', userTwoId: 'user-2' });
      mockPrisma.conversation.upsert.mockResolvedValue({ id: 'conv-1' });

      const result = await service.respond('invite-1', 'user-2', 'ACCEPTED');

      expect(mockPrisma.invitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invite-1' },
          data: expect.objectContaining({ status: 'ACCEPTED', respondedAt: expect.any(Date) }),
        }),
      );
      expect(mockPrisma.match.upsert).toHaveBeenCalled();
      expect(mockPrisma.conversation.upsert).toHaveBeenCalled();
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-1',
        'INVITATION',
        'Collaboration request accepted',
        'Start collaborating now!',
        expect.objectContaining({ invitationId: 'invite-1', status: 'ACCEPTED' }),
      );
      expect(result.status).toBe('ACCEPTED');
    });

    it('should reject invitation without creating match', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation({ id: 'invite-1', status: 'PENDING' }));
      mockPrisma.invitation.update.mockResolvedValue(mockInvitation({ status: 'REJECTED', respondedAt: new Date() }));

      const result = await service.respond('invite-1', 'user-2', 'REJECTED');

      expect(mockPrisma.match.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.conversation.upsert).not.toHaveBeenCalled();
      expect(result.status).toBe('REJECTED');
    });

    it('should throw NotFoundException for non-existent invitation', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      await expect(service.respond('invite-99', 'user-2', 'ACCEPTED')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for not-the-owner', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation({ receiverId: 'user-3' }));

      await expect(service.respond('invite-1', 'user-2', 'ACCEPTED')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for already-responded invitation', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation({ status: 'ACCEPTED' }));

      await expect(service.respond('invite-1', 'user-2', 'ACCEPTED')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not throw when notification creation fails', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation({ id: 'invite-1', status: 'PENDING' }));
      mockPrisma.invitation.update.mockResolvedValue(mockInvitation({ status: 'ACCEPTED', respondedAt: new Date() }));
      mockPrisma.match.upsert.mockResolvedValue({ id: 'match-1' });
      mockPrisma.conversation.upsert.mockResolvedValue({ id: 'conv-1' });
      mockNotifications.create.mockRejectedValue(new Error('Fail'));

      const result = await service.respond('invite-1', 'user-2', 'ACCEPTED');

      expect(result.status).toBe('ACCEPTED');
    });
  });

  describe('listReceived', () => {
    it('should return received invitations with sender profile', async () => {
      const invites = [mockInvitation(), mockInvitation({ id: 'invite-2', senderId: 'user-3' })];
      mockPrisma.invitation.findMany.mockResolvedValue(invites);

      const result = await service.listReceived('user-2');

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiverId: 'user-2' },
          include: expect.objectContaining({
            sender: { include: { profile: { select: { displayName: true, headline: true, avatarUrl: true } } } },
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(invites);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.invitation.findMany.mockResolvedValue([]);

      await service.listReceived('user-2', 'PENDING');

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiverId: 'user-2', status: 'PENDING' },
        }),
      );
    });
  });

  describe('listSent', () => {
    it('should return sent invitations with receiver profile', async () => {
      const invites = [mockInvitation()];
      mockPrisma.invitation.findMany.mockResolvedValue(invites);

      const result = await service.listSent('user-1');

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { senderId: 'user-1' },
          include: expect.objectContaining({
            receiver: { include: { profile: { select: { displayName: true, headline: true, avatarUrl: true } } } },
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(invites);
    });
  });
});
