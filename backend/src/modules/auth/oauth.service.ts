import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
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

  async authenticate(code: string, provider: 'github' | 'google', redirectUri?: string, userAgent?: string, ipAddress?: string) {
    this.logger.log(`OAuth authenticate attempt for provider: ${provider}`);

    let profile: OAuthProfile;
    try {
      profile = await this.exchangeCode(code, provider, redirectUri);
      this.logger.log(`OAuth profile fetched: ${profile.provider} id=${profile.providerId} email=${profile.email}`);
    } catch (err) {
      this.logger.error(`OAuth code exchange failed for ${provider}: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }

    try {
      const existing = await this.prisma.oAuthAccount.findUnique({
        where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
        include: { user: true },
      });

      if (existing) {
        this.logger.log(`Existing OAuth account found for ${profile.provider} ${profile.providerId}, issuing tokens`);
        return this.issueTokensForUser(existing.user, userAgent, ipAddress);
      }

      const matchedUser = profile.email
        ? await this.prisma.user.findUnique({ where: { email: profile.email } })
        : null;

      if (matchedUser) {
        this.logger.log(`Linking OAuth account to existing user ${matchedUser.id}`);
        await this.prisma.oAuthAccount.create({
          data: {
            userId: matchedUser.id,
            provider: profile.provider,
            providerId: profile.providerId,
            accessToken: null,
          },
        });
        return this.issueTokensForUser(matchedUser, userAgent, ipAddress);
      }

      this.logger.log(`Creating new user for OAuth ${profile.provider} email=${profile.email}`);
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

      return this.issueTokensForUser(user, userAgent, ipAddress);
    } catch (err) {
      this.logger.error(`OAuth database operation failed: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  private async issueTokensForUser(user: { id: string; email: string; role: string }, userAgent?: string, ipAddress?: string) {
    this.logger.log(`Issuing tokens for user ${user.id} (${user.email})`);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get('app.jwt.accessExpiresIn') },
    );

    const refreshToken = randomUUID() + randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt, userAgent, ipAddress },
    });

    this.logger.log(`Tokens issued successfully for user ${user.id}`);
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  private async exchangeCode(code: string, provider: 'github' | 'google', redirectUri?: string): Promise<OAuthProfile> {
    if (provider === 'github') {
      return this.exchangeGitHubCode(code, redirectUri);
    }
    return this.exchangeGoogleCode(code, redirectUri);
  }

  private async exchangeGitHubCode(code: string, redirectUri?: string): Promise<OAuthProfile> {
    this.logger.log('Exchanging GitHub authorization code for access token');

    const clientId = this.config.get('app.oauth.github.clientId');
    const clientSecret = this.config.get('app.oauth.github.clientSecret');
    if (!clientId || !clientSecret) {
      this.logger.error('GitHub OAuth credentials missing — check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars');
      throw new UnauthorizedException('GitHub OAuth is not configured');
    }

    const body: Record<string, string> = { client_id: clientId, client_secret: clientSecret, code };
    if (redirectUri) body.redirect_uri = redirectUri;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      this.logger.error(`GitHub token exchange failed: ${tokenData.error} — ${tokenData.error_description}`);
      throw new UnauthorizedException(`GitHub OAuth token exchange failed: ${tokenData.error_description ?? tokenData.error}`);
    }

    this.logger.log('Fetching GitHub user profile');

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      const bodyText = await userRes.text();
      this.logger.error(`GitHub user API returned ${userRes.status}: ${bodyText}`);
      throw new UnauthorizedException('Failed to fetch GitHub user profile');
    }
    const userData = (await userRes.json()) as { id: number; login: string; email?: string; name?: string; avatar_url?: string };

    if (!userData.email) {
      this.logger.log('No public email, fetching GitHub primary email');
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as { email: string; primary: boolean }[];
        const primary = emails.find((e) => e.primary);
        userData.email = primary?.email;
      }
    }

    if (!userData.email) {
      const placeholder = `github-${userData.login}@placeholder.devconnect.app`;
      this.logger.warn(`No verified email for GitHub user ${userData.login}, using placeholder ${placeholder}`);
      userData.email = placeholder;
    }

    const profile = {
      provider: 'github' as const,
      providerId: String(userData.id),
      email: userData.email,
      name: userData.name ?? userData.login,
      avatarUrl: userData.avatar_url,
    };
    this.logger.log(`GitHub profile resolved: email=${profile.email} name=${profile.name}`);
    return profile;
  }

  private async exchangeGoogleCode(code: string, redirectUri?: string): Promise<OAuthProfile> {
    this.logger.log('Exchanging Google authorization code for access token');

    const clientId = this.config.get('app.oauth.google.clientId');
    const clientSecret = this.config.get('app.oauth.google.clientSecret');
    if (!clientId || !clientSecret) {
      this.logger.error('Google OAuth credentials missing — check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars');
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const params: Record<string, string> = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
    };
    if (redirectUri) params.redirect_uri = redirectUri;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      this.logger.error(`Google token exchange failed: ${tokenData.error} — ${tokenData.error_description}`);
      throw new UnauthorizedException(`Google OAuth token exchange failed: ${tokenData.error_description ?? tokenData.error}`);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      const bodyText = await userRes.text();
      this.logger.error(`Google userinfo API returned ${userRes.status}: ${bodyText}`);
      throw new UnauthorizedException('Failed to fetch Google user profile');
    }
    const userData = (await userRes.json()) as { id: string; email: string; name: string; picture?: string };

    if (!userData.email) {
      this.logger.error('Google returned no email address');
      throw new UnauthorizedException('Google account must have a verified email address');
    }

    return {
      provider: 'google',
      providerId: userData.id,
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.picture,
    };
  }
}
