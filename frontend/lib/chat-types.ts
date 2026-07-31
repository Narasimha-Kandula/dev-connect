export interface Member {
  userId: string;
  user: { id: string; profile?: { displayName: string; avatarUrl?: string } };
}

export interface Conversation {
  id: string;
  members: Member[];
  messages?: { content?: string; createdAt: string }[];
  isGroup?: boolean;
  name?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  sender?: { profile?: { displayName: string; avatarUrl?: string } };
  reactions?: { id: string; emoji: string; userId: string }[];
  status?: MessageStatus;
}

export interface SearchResult {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  location?: string | null;
  experienceLevel?: string | null;
  reputationScore?: number;
  skills?: string[];
}
