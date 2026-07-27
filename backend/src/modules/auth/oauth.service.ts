import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

interface OAuthProfile {
  provider: 'github' | 'google';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async authenticate(code: string, provider: 'github' | 'google') {
    const profile = await this.exchangeCode(code, provider);

    const existing = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
      include: { user: true },
    });

    if (existing) {
      return this.issueTokensForUser(existing.user);
    }

    const matchedUser = profile.email
      ? await this.prisma.user.findUnique({ where: { email: profile.email } })
      : null;

    if (matchedUser) {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: matchedUser.id,
          provider: profile.provider,
          providerId: profile.providerId,
        },
      });
      return this.issueTokensForUser(matchedUser);
    }

    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        emailVerified: true,
        profile: {
          create: {
            displayName: profile.name,
            avatarUrl: profile.avatarUrl,
          },
        },
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
      },
    });

    return this.issueTokensForUser(user);
  }

  private async issueTokensForUser(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get('app.jwt.accessExpiresIn') },
    );

    const refreshToken = randomUUID() + randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt },
    });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  private async exchangeCode(code: string, provider: 'github' | 'google'): Promise<OAuthProfile> {
    if (provider === 'github') {
      return this.exchangeGitHubCode(code);
    }
    return this.exchangeGoogleCode(code);
  }

  private async exchangeGitHubCode(code: string): Promise<OAuthProfile> {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.config.get('oauth.github.clientId')!,
        client_secret: this.config.get('oauth.github.clientSecret')!,
        code,
      }),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('GitHub OAuth token exchange failed');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = (await userRes.json()) as { id: number; login: string; email?: string; name?: string; avatar_url?: string };

    if (!userData.email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = (await emailsRes.json()) as { email: string; primary: boolean }[];
      const primary = emails.find((e) => e.primary);
      userData.email = primary?.email ?? `${userData.login}@github.dev`;
    }

    return {
      provider: 'github',
      providerId: String(userData.id),
      email: userData.email ?? `${userData.login}@github.dev`,
      name: userData.name ?? userData.login,
      avatarUrl: userData.avatar_url,
    };
  }

  private async exchangeGoogleCode(code: string): Promise<OAuthProfile> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.get('oauth.google.clientId')!,
        client_secret: this.config.get('oauth.google.clientSecret')!,
        redirect_uri: this.config.get('oauth.google.redirectUri')!,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google OAuth token exchange failed');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = (await userRes.json()) as { id: string; email: string; name: string; picture?: string };

    return {
      provider: 'google',
      providerId: userData.id,
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.picture,
    };
  }
}
