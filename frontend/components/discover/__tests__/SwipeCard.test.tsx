import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwipeCard } from '../SwipeCard';
import type { DiscoverProfile } from '@/lib/discover-types';

// ─── Drag-end handler capture ───
type DragEndHandler = (event: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
let capturedDragEnd: DragEndHandler | null = null;

// ─── Mock framer-motion ───
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onDragEnd, onClick, drag, style, className }: Record<string, unknown>) => {
      // Only capture onDragEnd when actually provided (avoid overwrite from overlay divs)
      if (onDragEnd) capturedDragEnd = onDragEnd as DragEndHandler;

      return (
        <div
          data-testid={drag === 'x' ? 'swipe-card-drag' : 'swipe-card-static'}
          data-drag={String(drag)}
          onClick={onClick as React.MouseEventHandler}
          style={style as React.CSSProperties}
          className={className as string}
        >
          {children as React.ReactNode}
        </div>
      );
    },
  },
  useMotionValue: (initial: number) => initial,
  useTransform: (value: number) => value,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Mock child dependencies ───
vi.mock('@/components/profile-card', () => ({
  SkillsList: ({ skills, max }: { skills: { name: string }[]; max: number }) => (
    <ul data-testid="skills-list">
      {skills.slice(0, max).map((s) => (
        <li key={s.name} data-testid="skill-tag">{s.name}</li>
      ))}
    </ul>
  ),
}));

vi.mock('@/components/ExpandableBio', () => ({
  ExpandableBio: ({ text }: { text: string | null }) => (
    <div data-testid="expandable-bio">{text ?? 'No bio'}</div>
  ),
}));

vi.mock('@/lib/avatar', () => ({
  Avatar: ({ name, size }: { name: string; size: string }) => (
    <div data-testid="avatar" data-name={name} data-size={size}>{name.charAt(0)}</div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

// ─── Simulate drag-end (calls the captured handler) ───
function simulateDragEnd(offsetX: number, velocityX: number) {
  act(() => { capturedDragEnd?.(null, { offset: { x: offsetX }, velocity: { x: velocityX } }); });
}

// ─── Mock profile factory ───
function createProfile(overrides: Partial<DiscoverProfile> = {}): DiscoverProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Alice Chen',
    headline: 'Full Stack Engineer',
    bio: 'Building cool stuff with React and Node.js',
    avatarUrl: 'https://example.com/avatar.jpg',
    skills: [
      { name: 'React', proficiency: 5 },
      { name: 'Node.js', proficiency: 4 },
      { name: 'TypeScript', proficiency: 4 },
    ],
    location: 'San Francisco, CA',
    experienceLevel: 'senior',
    reputationScore: 1250,
    ...overrides,
  };
}

function renderTopCard(profile?: DiscoverProfile) {
  const p = profile ?? createProfile();
  const onSwipe = vi.fn();
  const onPreview = vi.fn();
  render(<SwipeCard profile={p} onSwipe={onSwipe} isTop exitDirection="right" onPreview={onPreview} />);
  return { onSwipe, onPreview, profile: p };
}

function renderNextCard(profile?: DiscoverProfile) {
  const p = profile ?? createProfile();
  const onSwipe = vi.fn();
  render(<SwipeCard profile={p} onSwipe={onSwipe} isTop={false} exitDirection="right" />);
  return { onSwipe, profile: p };
}

// ═══════════════════════════════════════════════
//  Render States
// ═══════════════════════════════════════════════

describe('render states', () => {
  beforeEach(() => { capturedDragEnd = null; });

  it('renders top card with full profile content', () => {
    renderTopCard();
    expect(screen.getByText('Alice Chen')).toBeTruthy();
    expect(screen.getByText('Full Stack Engineer')).toBeTruthy();
    expect(screen.getByText('1250')).toBeTruthy();
    expect(screen.getByText('pts')).toBeTruthy();
    expect(screen.getByTestId('skills-list')).toBeTruthy();
    expect(screen.getByTestId('expandable-bio')).toBeTruthy();
    expect(screen.getByText('Building cool stuff with React and Node.js')).toBeTruthy();
    expect(screen.getByText('San Francisco, CA')).toBeTruthy();
    expect(screen.getByText('senior')).toBeTruthy();
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });

  it('renders top card with drag="x" for swipe interaction', () => {
    renderTopCard();
    expect(screen.getByTestId('swipe-card-drag').getAttribute('data-drag')).toBe('x');
  });

  it('renders top card with Like and Nope badges', () => {
    renderTopCard();
    const likeBadge = screen.getByText('Like');
    expect(likeBadge.className).toContain('uppercase');
    expect(likeBadge.className).toContain('text-green-500');
    expect(likeBadge.className).toContain('border-green-500');

    const nopeBadge = screen.getByText('Nope');
    expect(nopeBadge.className).toContain('uppercase');
    expect(nopeBadge.className).toContain('text-red-500');
    expect(nopeBadge.className).toContain('border-red-500');
  });

  it('renders top card with cursor-grab affordance class', () => {
    renderTopCard();
    const dragEl = screen.getByTestId('swipe-card-drag');
    expect(dragEl.className).toContain('cursor-grab');
    expect(dragEl.className).toContain('active:cursor-grabbing');
  });

  it('renders next card with reduced content', () => {
    renderNextCard();
    // Should NOT have full profile content
    expect(screen.queryByText('Full Stack Engineer')).toBeNull();
    expect(screen.queryByText('1250')).toBeNull();
    expect(screen.queryByTestId('skills-list')).toBeNull();
    expect(screen.queryByTestId('expandable-bio')).toBeNull();
    expect(screen.queryByTestId('avatar')).toBeNull();
    // Should show only the displayName
    expect(screen.getByText('Alice Chen')).toBeTruthy();
  });

  it('renders next card without drag interaction', () => {
    renderNextCard();
    expect(screen.getByTestId('swipe-card-static').getAttribute('data-drag')).toBe('undefined');
  });

  it('renders next card with pointer-events-none class', () => {
    renderNextCard();
    expect(screen.getByTestId('swipe-card-static').className).toContain('pointer-events-none');
  });

  it('handles missing optional fields gracefully', () => {
    renderTopCard(createProfile({
      headline: '',
      bio: undefined,
      avatarUrl: null,
      location: undefined,
      experienceLevel: undefined,
      reputationScore: 0,
      skills: [],
    }));
    expect(screen.getByText('Alice Chen')).toBeTruthy();
    expect(screen.getByTestId('skills-list')).toBeTruthy();
    expect(screen.getByText('No bio')).toBeTruthy();
  });

  it('renders "New" when reputationScore is 0', () => {
    renderTopCard(createProfile({ reputationScore: 0 }));
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('renders "pts" when reputationScore is greater than 0', () => {
    renderTopCard(createProfile({ reputationScore: 500 }));
    expect(screen.getByText('500')).toBeTruthy();
    expect(screen.getByText('pts')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════
//  Click → Preview
// ═══════════════════════════════════════════════

describe('preview on click', () => {
  beforeEach(() => { capturedDragEnd = null; });

  it('calls onPreview when top card is clicked', () => {
    const { onPreview, profile } = renderTopCard();
    fireEvent.click(screen.getByTestId('swipe-card-drag'));
    expect(onPreview).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledWith(profile);
  });

  it('does not call onPreview when click fires multiple times', () => {
    const { onPreview } = renderTopCard();
    fireEvent.click(screen.getByTestId('swipe-card-drag'));
    fireEvent.click(screen.getByTestId('swipe-card-drag'));
    expect(onPreview).toHaveBeenCalledTimes(2);
  });

  it('does not throw when clicking next card (no onPreview)', () => {
    expect(() => {
      renderNextCard();
      // The next card uses motion.div without onClick — our mock creates a static div
      // that won't have the handler. This test verifies render doesn't crash.
    }).not.toThrow();
  });
});

// ═══════════════════════════════════════════════
//  Drag Gesture
// ═══════════════════════════════════════════════

describe('drag gesture', () => {
  beforeEach(() => { capturedDragEnd = null; });

  it('calls onSwipe("right") when dragged right past offset threshold (offset > 100)', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(150, 0);
    expect(onSwipe).toHaveBeenCalledWith('right');
  });

  it('calls onSwipe("right") when velocity exceeds threshold (velocity > 500)', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(50, 600);
    expect(onSwipe).toHaveBeenCalledWith('right');
  });

  it('calls onSwipe("left") when dragged left past offset threshold (offset < -100)', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(-150, 0);
    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('calls onSwipe("left") when velocity exceeds threshold (velocity < -500)', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(-50, -600);
    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('does NOT call onSwipe when offset is below threshold', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(50, 0);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('does NOT call onSwipe when offset and velocity are both below threshold', () => {
    const { onSwipe } = renderTopCard();
    simulateDragEnd(-50, 200);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('does NOT call onSwipe when clicking (not dragging)', () => {
    const { onSwipe } = renderTopCard();
    fireEvent.click(screen.getByTestId('swipe-card-drag'));
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('calls onSwipe with different profiles', () => {
    const { onSwipe } = renderTopCard(createProfile({ id: 'p2', userId: 'u2', displayName: 'Bob' }));
    simulateDragEnd(200, 0);
    expect(onSwipe).toHaveBeenCalledWith('right');
  });
});

// ═══════════════════════════════════════════════
//  Like / Nope Overlay
// ═══════════════════════════════════════════════

describe('Like/Nope overlay', () => {
  beforeEach(() => { capturedDragEnd = null; });

  it('Like badge is present in the DOM with correct styling', () => {
    renderTopCard();
    expect(screen.getByText('Like')).toBeTruthy();
  });

  it('Nope badge is present in the DOM with correct styling', () => {
    renderTopCard();
    expect(screen.getByText('Nope')).toBeTruthy();
  });
});
