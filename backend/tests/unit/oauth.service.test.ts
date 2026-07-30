import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from '../../src/modules/auth/oauth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: any;

  function createMockResponse(data: any, ok = true, status = 200) {
    return {
      ok,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  }

  const mockPrisma = () => ({
    oAuthAccount: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn(mockPrisma())),
  });

  const mockJwtService = { signAsync: jest.fn().mockResolvedValue('mock-token') };
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'app.oauth.github.clientId') return 'gh_client';
      if (key === 'app.oauth.github.clientSecret') return 'gh_secret';
      if (key === 'app.oauth.google.clientId') return 'google_client';
      if (key === 'app.oauth.google.clientSecret') return 'google_secret';
      if (key === 'jwt.accessSecret') return 'access-secret';
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      if (key === 'jwt.accessExpiresIn') return '15m';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: mockPrisma() },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('successfully authenticates via GitHub for returning user', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(createMockResponse({ access_token: 'gh_token' }))
      .mockResolvedValueOnce(createMockResponse({ id: 12345, login: 'testuser', email: 'test@example.com', name: 'Test', avatar_url: 'https://avatars.com/1' }));

    prisma.oAuthAccount.findUnique.mockResolvedValue({ user: { id: 'existing-user', email: 'test@example.com', role: 'USER' } });
    prisma.session.create.mockResolvedValue({});

    const result = await service.authenticate('valid-code', 'github', 'http://localhost:3000/auth/callback', 'TestAgent', '127.0.0.1');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('user');
    expect(result.user.id).toBe('existing-user');
  });

  it('throws when GitHub token exchange returns no access_token', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      createMockResponse({ error: 'bad_verification_code' }),
    );

    await expect(
      service.authenticate('bad-code', 'github', undefined, undefined, undefined),
    ).rejects.toThrow(/GitHub OAuth/);
  });

  it('throws when GitHub userinfo fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(createMockResponse({ access_token: 'gh_token' }))
      .mockResolvedValueOnce(createMockResponse({}, false, 401));

    await expect(
      service.authenticate('code', 'github', undefined, undefined, undefined),
    ).rejects.toThrow(/Failed to fetch GitHub user profile/);
  });

  it('throws when Google token exchange fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      createMockResponse({ error: 'invalid_grant' }, false, 400),
    );

    await expect(
      service.authenticate('bad-code', 'google', undefined, undefined, undefined),
    ).rejects.toThrow(/Google OAuth/);
  });

  it('throws when Google userinfo returns non-200', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(createMockResponse({ access_token: 'google_token' }))
      .mockResolvedValueOnce(createMockResponse({}, false, 401));

    await expect(
      service.authenticate('code', 'google', undefined, undefined, undefined),
    ).rejects.toThrow(/Failed to fetch Google user profile/);
  });
});
