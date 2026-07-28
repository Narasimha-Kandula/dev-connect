import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateApiKeyDto } from './dto/api-key.dto';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async issueTokens(userId: string, email: string, role: string, userAgent?: string, ipAddress?: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      { expiresIn: this.config.get('app.jwt.accessExpiresIn') },
    );

    const refreshToken = randomUUID() + randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.session.create({
      data: { userId, refreshToken, expiresAt, userAgent, ipAddress },
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists. Try logging in instead.');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: { displayName: dto.name },
        },
      },
      include: {
        profile: { include: { skills: { include: { skill: true } } } },
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const attempts = this.loginAttempts.get(dto.email);
    if (attempts?.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      throw new UnauthorizedException(`Account is temporarily locked. Try again in ${remaining} minute(s).`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        profile: { include: { skills: { include: { skill: true } } } },
      },
    });
    if (!user || !user.passwordHash) {
      this.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid email or password. Please try again.');
    }

    if (user.isBanned || user.isSuspended) {
      throw new UnauthorizedException('Account has been suspended. Please contact support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid email or password. Please try again.');
    }

    this.loginAttempts.delete(dto.email);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  private recordFailedLogin(email: string) {
    const current = this.loginAttempts.get(email) ?? { count: 0 };
    current.count++;
    if (current.count >= MAX_LOGIN_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      this.logger.warn(`Account locked due to ${current.count} failed attempts: ${email}`);
    }
    this.loginAttempts.set(email, current);
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('Account not found. Please log in again.');

    if (user.isBanned || user.isSuspended) {
      throw new UnauthorizedException('Account has been suspended.');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string) {
    await this.prisma.session.updateMany({
      where: { refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) throw new UnauthorizedException('OAuth accounts must set a password first.');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect.');

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: 'Password changed. All other sessions have been logged out.' };
  }

  listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const key = `dc_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    await this.prisma.apiKey.create({
      data: { userId, name: dto.name, keyHash },
    });
    return { key, name: dto.name };
  }

  listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revoked: false },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true, revoked: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeApiKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { revoked: true } });
    return { success: true };
  }

  async validateApiKey(key: string) {
    const keyHash = createHash('sha256').update(key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || apiKey.revoked) return null;
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    const user = await this.prisma.user.findUnique({ where: { id: apiKey.userId } });
    return user;
  }

  private sanitize(user: { passwordHash?: string | null; emailVerificationToken?: string | null; mfaSecret?: string | null; [key: string]: unknown }) {
    const { passwordHash, emailVerificationToken, mfaSecret, ...rest } = user;
    return rest;
  }
}
