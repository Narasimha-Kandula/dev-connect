export function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function shouldShowDateSeparator(msgs: { createdAt: string }[], idx: number) {
  if (idx === 0) return true;
  return !isSameDay(msgs[idx].createdAt, msgs[idx - 1].createdAt);
}

// ─── Conversation helpers (used across chat components) ───

export function partnerName(conv: { isGroup?: boolean; name?: string; members: { userId: string; user: { profile?: { displayName?: string } } }[] }, userId?: string): string {
  if (!userId) return 'Unknown';
  if (conv.isGroup && conv.name) return conv.name;
  const other = conv.members.find((m) => m.userId !== userId);
  return other?.user?.profile?.displayName ?? 'User';
}

export function partnerUserId(conv: { members: { userId: string }[] }, userId?: string): string | undefined {
  if (!userId) return undefined;
  return conv.members.find((m) => m.userId !== userId)?.userId;
}

export function partnerAvatarUrl(conv: { members: { userId: string; user: { profile?: { avatarUrl?: string } } }[] }, userId?: string): string | undefined {
  if (!userId) return undefined;
  const other = conv.members.find((m) => m.userId !== userId);
  return other?.user?.profile?.avatarUrl;
}

export function lastMsg(conv: { messages?: { content?: string }[] }): string {
  return conv.messages?.[0]?.content ?? 'No messages yet';
}
