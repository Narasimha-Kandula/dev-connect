'use client';

const QUEUE_KEY = 'devconnect_msg_queue';

export interface QueuedMessage {
  tempId: string;
  conversationId: string;
  content: string;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  retries: number;
}

export function getQueue(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const MAX_RETRIES = 5;

export function addToQueue(msg: QueuedMessage): void {
  const queue = getQueue();
  queue.push(msg);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(tempId: string): void {
  const queue = getQueue().filter((m) => m.tempId !== tempId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function incrementRetry(tempId: string): number {
  const queue = getQueue();
  const idx = queue.findIndex((m) => m.tempId === tempId);
  if (idx === -1) return 0;
  queue[idx].retries += 1;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue[idx].retries;
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function isOnline(): boolean {
  return navigator.onLine;
}
