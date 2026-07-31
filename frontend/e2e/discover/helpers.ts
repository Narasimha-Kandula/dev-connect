import type { Page } from '@playwright/test';

// ─── Mock Profiles ───────────────────────────────────────

export const mockProfiles = [
  {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Alice Chen',
    headline: 'Full Stack Engineer',
    bio: 'Passionate about React, Node.js, and building developer tools.',
    avatarUrl: null,
    skills: [
      { name: 'React', proficiency: 5 },
      { name: 'Node.js', proficiency: 4 },
      { name: 'TypeScript', proficiency: 5 },
      { name: 'GraphQL', proficiency: 3 },
    ],
    location: 'San Francisco, CA',
    experienceLevel: 'senior',
    reputationScore: 1250,
  },
  {
    id: 'profile-2',
    userId: 'user-2',
    displayName: 'Bob Smith',
    headline: 'Backend Developer',
    bio: 'Python and Go enthusiast. Building scalable microservices.',
    avatarUrl: null,
    skills: [
      { name: 'Python', proficiency: 5 },
      { name: 'Go', proficiency: 4 },
      { name: 'PostgreSQL', proficiency: 4 },
    ],
    location: 'New York, NY',
    experienceLevel: 'mid',
    reputationScore: 890,
  },
  {
    id: 'profile-3',
    userId: 'user-3',
    displayName: 'Carol Davis',
    headline: 'ML Engineer',
    bio: 'Working on NLP and computer vision.',
    avatarUrl: null,
    skills: [
      { name: 'Python', proficiency: 5 },
      { name: 'PyTorch', proficiency: 5 },
      { name: 'TensorFlow', proficiency: 4 },
      { name: 'Rust', proficiency: 2 },
    ],
    location: 'Seattle, WA',
    experienceLevel: 'senior',
    reputationScore: 2100,
  },
  {
    id: 'profile-4',
    userId: 'user-4',
    displayName: 'David Kim',
    headline: 'Frontend Developer',
    bio: null,
    avatarUrl: null,
    skills: [
      { name: 'React', proficiency: 4 },
      { name: 'Vue.js', proficiency: 3 },
      { name: 'CSS', proficiency: 5 },
    ],
    location: 'Austin, TX',
    experienceLevel: 'mid',
    reputationScore: 450,
  },
  {
    id: 'profile-5',
    userId: 'user-5',
    displayName: 'Eve Johnson',
    headline: 'DevOps Engineer',
    bio: 'Kubernetes, Docker, and CI/CD pipelines.',
    avatarUrl: null,
    skills: [
      { name: 'Kubernetes', proficiency: 5 },
      { name: 'Docker', proficiency: 5 },
      { name: 'Terraform', proficiency: 4 },
      { name: 'AWS', proficiency: 4 },
    ],
    location: 'Chicago, IL',
    experienceLevel: 'senior',
    reputationScore: 1800,
  },
  {
    id: 'profile-6',
    userId: 'user-6',
    displayName: 'Frank Mueller',
    headline: 'Mobile Developer',
    bio: 'React Native and Flutter.',
    avatarUrl: null,
    skills: [
      { name: 'React Native', proficiency: 5 },
      { name: 'Flutter', proficiency: 4 },
      { name: 'Swift', proficiency: 3 },
    ],
    location: 'Berlin, Germany',
    experienceLevel: 'mid',
    reputationScore: 720,
  },
];

const mockAutocompleteResults = [
  {
    id: 'ac-1',
    userId: 'user-1',
    displayName: 'Alice Chen',
    headline: 'Full Stack Engineer',
    avatarUrl: null,
  },
  {
    id: 'ac-2',
    userId: 'user-7',
    displayName: 'Alex Turner',
    headline: 'React Developer',
    avatarUrl: null,
  },
];

const mockSkillSuggestions = [
  { id: 'skill-react', name: 'React' },
  { id: 'skill-python', name: 'Python' },
  { id: 'skill-typescript', name: 'TypeScript' },
];

// ─── Constants ───────────────────────────────────────────

export const API_BASE = 'http://localhost:4000/api/v1';
export const MOCK_TOKEN = 'mock-access-token-for-testing';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-for-testing';
const MOCK_USER = {
  id: 'test-user',
  email: 'test@devconnect.dev',
  role: 'developer',
  emailVerified: true,
  profile: {
    displayName: 'Test User',
    headline: 'Full Stack Developer',
    bio: 'Testing the app',
    avatarUrl: null,
    location: 'Remote',
    reputationScore: 500,
    profileCompleteness: 80,
  },
};

// ─── Auth Setup ──────────────────────────────────────────

/**
 * Sets up localStorage auth tokens so the client-side auth store
 * (useAuthStore / zustand) can find a valid token.
 *
 * NOTE: The middleware auth check is handled by Playwright's
 * `extraHTTPHeaders` (set via `test.use()` in the spec file),
 * which sends `Authorization: Bearer <token>` on every request.
 *
 * Call once per test before navigation.
 * addInitScript persists across navigations (including reload).
 */
export async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-access-token-for-testing');
    localStorage.setItem('refreshToken', 'mock-refresh-token-for-testing');
  });
}

// ─── API Route Mocks ─────────────────────────────────────

/**
 * Registers API route interceptors for all discover-related endpoints.
 */
export async function setupApiMocks(page: Page) {
  // ── Specific routes FIRST (FIFO) before the generic /discover** catch-all ──

  // Swipe / undo (more specific, register first so they win FIFO)
  await page.route(`${API_BASE}/discover/swipe`, async (route) => {
    const body = route.request().postDataJSON();
    const matched = body?.action === 'LIKE' && body?.targetId === 'profile-1';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        matched,
        match: matched ? { matchScore: 85 } : undefined,
      }),
    });
  });

  await page.route(`${API_BASE}/discover/undo`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Discover profiles list — use ** glob to match query params (e.g. ?sort=newest&limit=5)
  await page.route(`${API_BASE}/discover**`, async (route) => {
    const url = new URL(route.request().url());
    const sort = url.searchParams.get('sort');
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const skill = url.searchParams.get('skill');
    const location = url.searchParams.get('location');

    let filtered = [...mockProfiles];

    if (skill) {
      const skills = skill.split(',');
      filtered = filtered.filter((p) =>
        skills.some((s) => p.skills.some((ps) => ps.name.toLowerCase() === s.toLowerCase())),
      );
    }
    if (location) {
      filtered = filtered.filter(
        (p) => p.location?.toLowerCase().includes(location.toLowerCase()),
      );
    }
    if (sort === 'newest') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered.slice(0, 5)),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered.slice(offset, offset + 10)),
    });
  });

  // Search autocomplete
  await page.route(`${API_BASE}/search/autocomplete*`, async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';

    if (q.toLowerCase().includes('zzz')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAutocompleteResults),
    });
  });

  // Skills autocomplete (filter panel)
  await page.route(`${API_BASE}/skills*`, async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('search') ?? '';

    if (q.toLowerCase().includes('zzz')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    const filtered = mockSkillSuggestions.filter((s) =>
      s.name.toLowerCase().includes(q.toLowerCase()),
    );
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });

  // Auth endpoints (used during page init — /users/me, /auth/refresh)
  await page.route(`${API_BASE}/users/me`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route(`${API_BASE}/auth/refresh`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: MOCK_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      }),
    });
  });
}

// ─── Test Lifecycle Helpers ──────────────────────────────

/**
 * Full setup for tests that use the default mock data.
 * Call in beforeEach.
 *
 * IMPORTANT: The spec file must set `test.use({ extraHTTPHeaders })`
 * with a valid Bearer token so the middleware passes the request through.
 */
export async function setupDiscoverPage(page: Page) {
  await setupAuth(page);
  await setupApiMocks(page);
  await page.goto('/discover');
  await page.waitForSelector('h1:has-text("Discover Developers")', { timeout: 20000 });
  // Let the page settle (API responses, framer-motion animations)
  await page.waitForTimeout(500);
}

/**
 * For tests that need a completely custom /discover mock (e.g. empty state,
 * edge cases).
 *
 * NOTE: Unroutes any previously-registered /discover handler (from
 * beforeEach), then registers the custom one first so it wins FIFO.
 */
export async function setupDiscoverPageWithCustomProfiles(
  page: Page,
  profiles: Array<Record<string, unknown>>,
) {
  // Unroute the default /discover handler that beforeEach registered
  await page.unroute(`${API_BASE}/discover**`);

  await setupAuth(page);

  // Auth mocks (always needed)
  await page.route(`${API_BASE}/users/me`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });
  await page.route(`${API_BASE}/auth/refresh`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: MOCK_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      }),
    });
  });

  // Specific routes first (swipe/undo)
  await page.route(`${API_BASE}/discover/swipe`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ matched: false }),
    });
  });
  await page.route(`${API_BASE}/discover/undo`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Custom profile mock — use ** to match query params
  await page.route(`${API_BASE}/discover**`, async (route) => {
    const url = new URL(route.request().url());
    const sort = url.searchParams.get('sort');
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    if (sort === 'newest') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profiles.slice(0, 5)),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(profiles.slice(offset, offset + 10)),
    });
  });

  // Search/skills mocks
  await page.route(`${API_BASE}/search/autocomplete*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
  await page.route(`${API_BASE}/skills*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ matched: false }),
    });
  });
  await page.route(`${API_BASE}/discover/undo`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route(`${API_BASE}/skills*`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSkillSuggestions),
    });
  });

  await page.goto('/discover');
  await page.waitForSelector('h1:has-text("Discover Developers")', { timeout: 20000 });
  await page.waitForTimeout(500);
}
