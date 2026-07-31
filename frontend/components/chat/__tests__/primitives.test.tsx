import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EMOJI_CATEGORIES,
  ImagePreviewModal,
  ChatContextMenu,
  EmojiPicker,
  ScrollToBottomBtn,
} from '../primitives';

// ─── EMOJI_CATEGORIES ───────────────────────────────────

describe('EMOJI_CATEGORIES', () => {
  it('has 4 categories', () => {
    expect(EMOJI_CATEGORIES).toHaveLength(4);
  });

  it('each category has a name and emojis array', () => {
    for (const cat of EMOJI_CATEGORIES) {
      expect(typeof cat.name).toBe('string');
      expect(Array.isArray(cat.emojis)).toBe(true);
      expect(cat.emojis.length).toBeGreaterThan(0);
    }
  });

  it('has the expected category names', () => {
    const names = EMOJI_CATEGORIES.map((c) => c.name);
    expect(names).toEqual(['Smileys', 'Gestures', 'Hearts', 'Objects']);
  });

  it('contains common emojis', () => {
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    expect(allEmojis).toContain('😀');
    expect(allEmojis).toContain('👍');
    expect(allEmojis).toContain('❤️');
    expect(allEmojis).toContain('🔥');
  });
});

// ─── ScrollToBottomBtn ──────────────────────────────────

describe('ScrollToBottomBtn', () => {
  it('renders when visible is true', () => {
    const onClick = vi.fn();
    render(<ScrollToBottomBtn visible={true} onClick={onClick} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('returns null when visible is false', () => {
    const { container } = render(<ScrollToBottomBtn visible={false} onClick={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});

// ─── ImagePreviewModal ──────────────────────────────────

describe('ImagePreviewModal', () => {
  it('renders the image with alt text', () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal url="https://example.com/test.png" name="Test Image" onClose={onClose} />);
    const img = screen.getByAltText('Test Image');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/test.png');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal url="https://example.com/test.png" name="Test" onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal url="https://example.com/test.png" name="Test" onClose={onClose} />);
    const backdrop = screen.getByAltText('Test').closest('[class*="inset-0"]');
    if (backdrop) fireEvent.click(backdrop);
    // The backdrop has onClick={onClose}
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── ChatContextMenu ────────────────────────────────────

describe('ChatContextMenu', () => {
  const baseProps = {
    x: 100,
    y: 200,
    onClose: vi.fn(),
    onReply: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onReact: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Edit, Reply, React, Delete for own messages', () => {
    render(<ChatContextMenu {...baseProps} isOwn={true} />);
    expect(screen.getByText('Edit')).toBeDefined();
    expect(screen.getByText('Reply')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('shows only Reply and React for other messages', () => {
    render(<ChatContextMenu {...baseProps} isOwn={false} />);
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.getByText('Reply')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('calls onReply when Reply is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatContextMenu {...baseProps} isOwn={false} />);
    await user.click(screen.getByText('Reply'));
    expect(baseProps.onReply).toHaveBeenCalledOnce();
  });
});

// ─── EmojiPicker ────────────────────────────────────────

describe('EmojiPicker', () => {
  it('renders category tabs', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={() => {}} />);
    for (const cat of EMOJI_CATEGORIES) {
      expect(screen.getByText(cat.name)).toBeDefined();
    }
  });

  it('renders emoji buttons', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={() => {}} />);
    // Should render the first category's emojis by default
    const firstCat = EMOJI_CATEGORIES[0];
    const firstEmoji = firstCat.emojis[0];
    expect(screen.getByText(firstEmoji)).toBeDefined();
  });

  it('calls onSelect when an emoji is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={() => {}} />);
    const firstEmoji = EMOJI_CATEGORIES[0].emojis[0];
    await user.click(screen.getByText(firstEmoji));
    expect(onSelect).toHaveBeenCalledWith(firstEmoji);
  });

  it('closes on outside click', () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={() => {}} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
