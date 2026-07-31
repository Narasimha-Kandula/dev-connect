import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTime,
  formatMsgTime,
  formatDateSeparator,
  isSameDay,
  shouldShowDateSeparator,
  partnerName,
  partnerUserId,
  partnerAvatarUrl,
  lastMsg,
} from '../chat-utils';

// ─── Mock Date ──────────────────────────────────────────

const MOCK_NOW = new Date('2026-07-30T14:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── formatTime ─────────────────────────────────────────

describe('formatTime', () => {
  it('shows time for today', () => {
    // Use a time string that's today (system timezone adjusts the displayed time)
    const today = new Date().toISOString();
    const result = formatTime(today);
    // Should show a time string with digits and colons/AM/PM, not 'Yesterday'
    expect(result).not.toBe('Yesterday');
    expect(result).toMatch(/\d/);
  });

  it('shows "Yesterday" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000); // 24 hours ago
    const result = formatTime(yesterday.toISOString());
    expect(result).toBe('Yesterday');
  });

  it('shows date for older messages', () => {
    const old = new Date(Date.now() - 86400000 * 10); // 10 days ago
    const result = formatTime(old.toISOString());
    // Should show a date, not 'Yesterday'
    expect(result).not.toBe('Yesterday');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── formatMsgTime ──────────────────────────────────────

describe('formatMsgTime', () => {
  it('formats time as a string with digits', () => {
    const result = formatMsgTime(new Date().toISOString());
    // Should show time digits regardless of locale/timezone
    expect(result).toMatch(/\d/);
  });
});

// ─── formatDateSeparator ────────────────────────────────

describe('formatDateSeparator', () => {
  it('shows "Today" for today', () => {
    const result = formatDateSeparator(MOCK_NOW.toISOString());
    expect(result).toBe('Today');
  });

  it('shows "Yesterday" for yesterday', () => {
    const yesterday = new Date(MOCK_NOW);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDateSeparator(yesterday.toISOString());
    expect(result).toBe('Yesterday');
  });

  it('shows full date for older dates', () => {
    const old = new Date('2026-07-15T10:00:00Z');
    const result = formatDateSeparator(old.toISOString());
    expect(result).toContain('Wednesday');
    expect(result).toContain('July');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

// ─── isSameDay ──────────────────────────────────────────

describe('isSameDay', () => {
  it('returns true for same day (noon UTC is same day everywhere)', () => {
    const a = '2026-07-30T12:00:00Z';
    const b = '2026-07-30T13:00:00Z';
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for different days', () => {
    const a = '2026-07-30T12:00:00Z';
    const b = '2026-07-31T12:00:00Z';
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for different months', () => {
    const a = '2026-07-30T12:00:00Z';
    const b = '2026-08-01T12:00:00Z';
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for different years', () => {
    const a = '2026-07-30T12:00:00Z';
    const b = '2027-07-30T12:00:00Z';
    expect(isSameDay(a, b)).toBe(false);
  });
});

// ─── shouldShowDateSeparator ────────────────────────────

describe('shouldShowDateSeparator', () => {
  const msgs = [
    { createdAt: '2026-07-30T12:00:00Z' },
    { createdAt: '2026-07-30T13:00:00Z' },
    { createdAt: '2026-07-31T12:00:00Z' },
  ];

  it('returns true for first message', () => {
    expect(shouldShowDateSeparator(msgs, 0)).toBe(true);
  });

  it('returns false for same day after previous', () => {
    expect(shouldShowDateSeparator(msgs, 1)).toBe(false);
  });

  it('returns true for different day', () => {
    expect(shouldShowDateSeparator(msgs, 2)).toBe(true);
  });
});

// ─── partnerName ────────────────────────────────────────

describe('partnerName', () => {
  const baseConv = {
    isGroup: false,
    members: [
      { userId: 'me', user: { profile: { displayName: 'Alice' } } },
      { userId: 'them', user: { profile: { displayName: 'Bob' } } },
    ],
  };

  it('returns partner display name', () => {
    expect(partnerName(baseConv, 'me')).toBe('Bob');
  });

  it('returns "User" when partner has no displayName', () => {
    const conv = {
      ...baseConv,
      members: [
        { userId: 'me', user: { profile: { displayName: 'Alice' } } },
        { userId: 'them', user: { profile: {} } },
      ],
    };
    expect(partnerName(conv, 'me')).toBe('User');
  });

  it('returns group name when isGroup', () => {
    const groupConv = {
      ...baseConv,
      isGroup: true,
      name: 'My Group',
    };
    expect(partnerName(groupConv, 'me')).toBe('My Group');
  });

  it('returns "Unknown" when userId is undefined', () => {
    expect(partnerName(baseConv, undefined)).toBe('Unknown');
  });
});

// ─── partnerUserId ──────────────────────────────────────

describe('partnerUserId', () => {
  const conv = {
    members: [
      { userId: 'me' },
      { userId: 'them' },
    ],
  };

  it('returns the other user ID', () => {
    expect(partnerUserId(conv, 'me')).toBe('them');
  });

  it('returns undefined when no userId provided', () => {
    expect(partnerUserId(conv, undefined)).toBeUndefined();
  });
});

// ─── partnerAvatarUrl ───────────────────────────────────

describe('partnerAvatarUrl', () => {
  const conv = {
    members: [
      { userId: 'me', user: { profile: { avatarUrl: 'alice.jpg' } } },
      { userId: 'them', user: { profile: { avatarUrl: 'bob.jpg' } } },
    ],
  };

  it("returns partner's avatar URL", () => {
    expect(partnerAvatarUrl(conv, 'me')).toBe('bob.jpg');
  });

  it('returns undefined when no userId provided', () => {
    expect(partnerAvatarUrl(conv, undefined)).toBeUndefined();
  });
});

// ─── lastMsg ────────────────────────────────────────────

describe('lastMsg', () => {
  it('returns the content of the first message', () => {
    const conv = {
      messages: [{ content: 'Hello!', createdAt: '2026-07-30T10:00:00Z' }],
    };
    expect(lastMsg(conv)).toBe('Hello!');
  });

  it('returns fallback when messages array is empty', () => {
    const conv = { messages: [] };
    expect(lastMsg(conv)).toBe('No messages yet');
  });

  it('returns fallback when messages is undefined', () => {
    const conv = {};
    expect(lastMsg(conv)).toBe('No messages yet');
  });
});
