export interface AutocompleteResult {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
}

export interface DiscoverProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio?: string;
  avatarUrl: string | null;
  skills: { name: string; proficiency: number }[];
  location?: string;
  experienceLevel?: string;
  reputationScore: number;
}

export interface DiscoverFilters {
  skills: string[];
  location: string;
  experience: string;
  remote: boolean;
  available: boolean;
}

export interface MatchModalState {
  partnerName: string;
  partnerId: string;
  matchScore?: number;
}

