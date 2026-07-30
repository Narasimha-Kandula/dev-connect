import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, ConflictException, UnauthorizedException, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { OAuthService } from '../../src/modules/auth/oauth.service';
import { MfaService } from '../../src/modules/auth/mfa.service';
import { PasswordResetService } from '../../src/modules/auth/password-reset.service';
import { EmailVerificationService } from '../../src/modules/auth/email-verification.service';
import { ChatController } from '../../src/modules/chat/chat.controller';
import { ChatService } from '../../src/modules/chat/chat.service';
import { InviteController } from '../../src/modules/invite/invite.controller';
import { InviteService } from '../../src/modules/invite/invite.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
  listApiKeys: jest.fn(),
  createApiKey: jest.fn(),
  revokeApiKey: jest.fn(),
  listSessions: jest.fn(),
  revokeSession: jest.fn(),
  exportData: jest.fn(),
  validateApiKey: jest.fn(),
};

const mockOAuthService = { authenticate: jest.fn() };
const mockMfaService = { generateSecret: jest.fn(), enable: jest.fn(), validate: jest.fn(), disable: jest.fn() };
const mockPasswordResetService = { sendResetEmail: jest.fn(), resetPassword: jest.fn() };
const mockEmailVerificationService = { sendVerification: jest.fn(), verify: jest.fn(), sendChangeEmail: jest.fn(), confirmChange: jest.fn() };

const mockChatService = {
  listConversations: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
  createOrGetConversation: jest.fn(),
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
  markRead: jest.fn(),
};

const mockInviteService = {
  send: jest.fn(),
  respond: jest.fn(),
  listReceived: jest.fn(),
  listSent: jest.fn(),
};

const mockJwtGuard = { canActivate: jest.fn(() => true) };

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('API Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, ChatController, InviteController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: MfaService, useValue: mockMfaService },
        { provide: PasswordResetService, useValue: mockPasswordResetService },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: ChatService, useValue: mockChatService },
        { provide: InviteService, useValue: mockInviteService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: UUID };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── AUTH ENDPOINTS ──────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    const validBody = { email: 'test@example.com', password: 'Str0ng!Pass', name: 'Test User' };

    it('201 — creates user and returns tokens', async () => {
      mockAuthService.register.mockResolvedValue({ user: { id: 'u1' }, accessToken: 'at', refreshToken: 'rt' });
      const res = await request(app.getHttpServer()).post('/auth/register').send(validBody);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('400 — rejects missing fields', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('400 — rejects invalid email', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({ ...validBody, email: 'notanemail' });
      expect(res.status).toBe(400);
    });

    it('409 — returns conflict when email exists', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictException('already exists'));
      const res = await request(app.getHttpServer()).post('/auth/register').send(validBody);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    const validBody = { email: 'test@example.com', password: 'Str0ng!Pass' };

    it('200 — returns tokens on success', async () => {
      mockAuthService.login.mockResolvedValue({ user: { id: 'u1' }, accessToken: 'at', refreshToken: 'rt' });
      const res = await request(app.getHttpServer()).post('/auth/login').send(validBody);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('401 — rejects invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid email or password'));
      const res = await request(app.getHttpServer()).post('/auth/login').send(validBody);
      expect(res.status).toBe(401);
    });

    it('400 — rejects empty body', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('200 — refreshes token', async () => {
      mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
      const res = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'valid-rt' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('400 — rejects missing refreshToken', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh').send({});
      expect(res.status).toBe(400);
    });

    it('401 — rejects expired token', async () => {
      mockAuthService.refresh.mockRejectedValue(new UnauthorizedException('Session has expired'));
      const res = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'expired-rt' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('200 — logout succeeds', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });
      const res = await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'rt' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/change-password (guarded)', () => {
    it('201 — password changed', async () => {
      mockAuthService.changePassword.mockResolvedValue({ success: true });
      const res = await request(app.getHttpServer()).post('/auth/change-password').send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });
      expect(res.status).toBe(201);
    });
    it('401 — wrong password', async () => {
      mockAuthService.changePassword.mockRejectedValue(new UnauthorizedException('Current password is incorrect'));
      const res = await request(app.getHttpServer()).post('/auth/change-password').send({ currentPassword: 'wrong', newPassword: 'newpassword123' });
      expect(res.status).toBe(401);
    });
  });

  // ─── CHAT ENDPOINTS ──────────────────────────────────────────────────────

  describe('GET /chat/conversations (guarded)', () => {
    it('200 — returns conversations', async () => {
      mockChatService.listConversations.mockResolvedValue([{ id: 'c1' }]);
      const res = await request(app.getHttpServer()).get('/chat/conversations');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /chat/conversations (guarded)', () => {
    it('201 — creates/gets conversation', async () => {
      mockChatService.createOrGetConversation.mockResolvedValue({ id: 'c1', members: [] });
      const res = await request(app.getHttpServer()).post('/chat/conversations').send({ targetUserId: UUID });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
    it('400 — missing targetUserId', async () => {
      const res = await request(app.getHttpServer()).post('/chat/conversations').send({});
      expect(res.status).toBe(400);
    });
    it('400 — invalid UUID', async () => {
      const res = await request(app.getHttpServer()).post('/chat/conversations').send({ targetUserId: 'not-a-uuid' });
      expect(res.status).toBe(400);
    });
    it('403 — self-conversation forbidden', async () => {
      mockChatService.createOrGetConversation.mockRejectedValue(new ForbiddenException('Cannot start a conversation with yourself'));
      const res = await request(app.getHttpServer()).post('/chat/conversations').send({ targetUserId: UUID });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /chat/conversations/:id/messages (guarded)', () => {
    it('200 — returns messages', async () => {
      mockChatService.getMessages.mockResolvedValue([{ id: 'm1', content: 'Hello' }]);
      const res = await request(app.getHttpServer()).get('/chat/conversations/c1/messages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('200 — supports cursor pagination', async () => {
      mockChatService.getMessages.mockResolvedValue([]);
      await request(app.getHttpServer()).get('/chat/conversations/c1/messages?cursor=m1');
      expect(mockChatService.getMessages).toHaveBeenCalledWith('c1', UUID, 'm1');
    });
    it('403 — non-member forbidden', async () => {
      mockChatService.getMessages.mockRejectedValue(new ForbiddenException('Not a member'));
      const res = await request(app.getHttpServer()).get('/chat/conversations/c1/messages');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /chat/conversations/:id/messages (guarded)', () => {
    it('201 — sends message', async () => {
      mockChatService.sendMessage.mockResolvedValue({ id: 'm1', content: 'Hi' });
      const res = await request(app.getHttpServer()).post('/chat/conversations/c1/messages').send({ content: 'Hi' });
      expect(res.status).toBe(201);
    });
    it('400 — missing content', async () => {
      const res = await request(app.getHttpServer()).post('/chat/conversations/c1/messages').send({});
      expect(res.status).toBe(400);
    });
    it('403 — non-member forbidden', async () => {
      mockChatService.sendMessage.mockRejectedValue(new ForbiddenException('Not a member'));
      const res = await request(app.getHttpServer()).post('/chat/conversations/c1/messages').send({ content: 'Hi' });
      expect(res.status).toBe(403);
    });
  });

  // ─── INVITE ENDPOINTS ────────────────────────────────────────────────────

  describe('POST /invite (guarded)', () => {
    it('201 — sends invitation', async () => {
      mockInviteService.send.mockResolvedValue({ id: 'i1', status: 'PENDING' });
      const res = await request(app.getHttpServer()).post('/invite').send({ receiverId: UUID });
      expect(res.status).toBe(201);
    });
    it('400 — self-invite rejected', async () => {
      mockInviteService.send.mockRejectedValue(new BadRequestException('Cannot invite yourself'));
      const res = await request(app.getHttpServer()).post('/invite').send({ receiverId: UUID });
      expect(res.status).toBe(400);
    });
    it('400 — duplicate invite rejected', async () => {
      mockInviteService.send.mockRejectedValue(new BadRequestException('already have a pending invitation'));
      const res = await request(app.getHttpServer()).post('/invite').send({ receiverId: '660e8400-e29b-41d4-a716-446655440001' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /invite/received (guarded)', () => {
    it('200 — lists received invitations', async () => {
      mockInviteService.listReceived.mockResolvedValue([{ id: 'i1', sender: { profile: { displayName: 'Alice' } } }]);
      const res = await request(app.getHttpServer()).get('/invite/received');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    it('200 — filters by status', async () => {
      mockInviteService.listReceived.mockResolvedValue([]);
      await request(app.getHttpServer()).get('/invite/received?status=PENDING');
      expect(mockInviteService.listReceived).toHaveBeenCalledWith(UUID, 'PENDING');
    });
  });

  describe('GET /invite/sent (guarded)', () => {
    it('200 — lists sent invitations', async () => {
      mockInviteService.listSent.mockResolvedValue([{ id: 'i1', receiver: { profile: { displayName: 'Bob' } } }]);
      const res = await request(app.getHttpServer()).get('/invite/sent');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /invite/:id/respond (guarded)', () => {
    it('201 — accepts invitation', async () => {
      mockInviteService.respond.mockResolvedValue({ id: 'i1', status: 'ACCEPTED' });
      const res = await request(app.getHttpServer()).post('/invite/i1/respond').send({ action: 'ACCEPTED' });
      expect(res.status).toBe(201);
    });
    it('201 — rejects invitation', async () => {
      mockInviteService.respond.mockResolvedValue({ id: 'i1', status: 'REJECTED' });
      const res = await request(app.getHttpServer()).post('/invite/i1/respond').send({ action: 'REJECTED' });
      expect(res.status).toBe(201);
    });
    it('404 — non-existent invitation', async () => {
      mockInviteService.respond.mockRejectedValue(new NotFoundException('Invitation not found'));
      const res = await request(app.getHttpServer()).post('/invite/nonexistent/respond').send({ action: 'ACCEPTED' });
      expect(res.status).toBe(404);
    });
    it('403 — not your invitation', async () => {
      mockInviteService.respond.mockRejectedValue(new ForbiddenException('Not your invitation'));
      const res = await request(app.getHttpServer()).post('/invite/i1/respond').send({ action: 'ACCEPTED' });
      expect(res.status).toBe(403);
    });
    it('400 — already responded', async () => {
      mockInviteService.respond.mockRejectedValue(new BadRequestException('Invitation already responded'));
      const res = await request(app.getHttpServer()).post('/invite/i1/respond').send({ action: 'ACCEPTED' });
      expect(res.status).toBe(400);
    });
  });

  // ─── ERROR CONTRACT ─────────────────────────────────────────────────────

  describe('Error format contract', () => {
    it('400 errors return { message, statusCode } shape', async () => {
      mockAuthService.register.mockRejectedValue(new BadRequestException('Validation failed'));
      const res = await request(app.getHttpServer()).post('/auth/register').send({ email: 'bad' });
      expect(res.body).toHaveProperty('message');
      expect(res.status).toBe(400);
    });
    it('401 errors return { message, statusCode } shape', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Unauthorized'));
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'test@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
    it('500 errors return { message, statusCode } shape', async () => {
      mockChatService.listConversations.mockRejectedValue(new Error('Unexpected error'));
      const res = await request(app.getHttpServer()).get('/chat/conversations');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
    });
  });
});
