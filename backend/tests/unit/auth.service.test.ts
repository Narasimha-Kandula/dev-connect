jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockConfig: any;

  beforeEach(() => {
    mockJwt = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'app.jwt.accessExpiresIn') return '15m';
        return undefined;
      }),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      apiKey: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      profile: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    service = new AuthService(mockPrisma as any, mockJwt as any, mockConfig as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function mockUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: 'USER',
      isBanned: false,
      isSuspended: false,
      deletedAt: null,
      emailVerified: true,
      mfaSecret: null,
      emailVerificationToken: null,
      profile: { displayName: 'Test User' },
      ...overrides,
    };
  }

  function mockSessionToken() {
    return {
      id: 'session-1',
      refreshToken: 'refresh-token-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    };
  }

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser());

      const result = await service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            passwordHash: 'hashed-password',
            profile: expect.objectContaining({ create: { displayName: 'Test User' } }),
          }),
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'correct-password' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for OAuth-only user (no passwordHash)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser({ passwordHash: null }));

      await expect(
        service.login({ email: 'oauth@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for banned user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser({ isBanned: true }));

      await expect(
        service.login({ email: 'banned@example.com', password: 'password123' }),
      ).rejects.toThrow('Account has been suspended');
    });

    it('should throw UnauthorizedException for suspended user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser({ isSuspended: true }));

      await expect(
        service.login({ email: 'suspended@example.com', password: 'password123' }),
      ).rejects.toThrow('Account has been suspended');
    });

    it('should lock account after 5 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      for (let i = 0; i < 5; i++) {
        await expect(
          service.login({ email: 'test@example.com', password: 'wrong' }),
        ).rejects.toThrow(UnauthorizedException);
      }

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow('Account is temporarily locked');
    });
  });

  describe('refresh', () => {
    it('should issue new tokens for a valid refresh token', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSessionToken());
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        ...mockSessionToken(),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked refresh token', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        ...mockSessionToken(),
        revokedAt: new Date(),
      });

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(service.refresh('nonexistent-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for banned user during refresh', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSessionToken());
      mockPrisma.user.findUnique.mockResolvedValue(mockUser({ isBanned: true }));

      await expect(service.refresh('valid-token')).rejects.toThrow('Account has been suspended');
    });
  });

  describe('logout', () => {
    it('should revoke the session', async () => {
      const result = await service.logout('refresh-token-1');

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { refreshToken: 'refresh-token-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('changePassword', () => {
    it('should change password and revoke other sessions', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.changePassword('user-1', { currentPassword: 'old-pass', newPassword: 'new-pass' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { passwordHash: 'hashed-password' },
        }),
      );
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong-pass', newPassword: 'new-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for OAuth-only user', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser({ passwordHash: null }));

      await expect(
        service.changePassword('user-1', { currentPassword: 'any-pass', newPassword: 'new-pass' }),
      ).rejects.toThrow('OAuth accounts must set a password first');
    });
  });

  describe('deleteAccount', () => {
    it('should soft-delete user and anonymize data', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.deleteAccount('user-1', 'password');

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            email: expect.stringContaining('deleted-'),
            passwordHash: null,
            emailVerified: false,
            deletedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockPrisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            displayName: 'Deleted User',
            isPublic: false,
          }),
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.deleteAccount('user-1', 'wrong-password')).rejects.toThrow(UnauthorizedException);
    });

    it('should skip password check if user has no passwordHash', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser({ passwordHash: null }));

      const result = await service.deleteAccount('user-1');

      expect(result.success).toBe(true);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    it('should return user for a valid non-revoked API key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 'key-1', userId: 'user-1', revoked: false });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser());
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.validateApiKey('valid-api-key');

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'key-1' },
          data: { lastUsedAt: expect.any(Date) },
        }),
      );
      expect(result).toEqual(mockUser());
    });

    it('should return null for a revoked API key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 'key-1', userId: 'user-1', revoked: true });

      const result = await service.validateApiKey('revoked-api-key');

      expect(result).toBeNull();
      expect(mockPrisma.apiKey.update).not.toHaveBeenCalled();
    });

    it('should return null when API key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateApiKey('nonexistent-key');

      expect(result).toBeNull();
    });
  });
});
