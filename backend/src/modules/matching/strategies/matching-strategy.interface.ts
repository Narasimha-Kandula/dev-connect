export interface MatchScoreInput {
  userId: string;
  targetUserId: string;
  skills: { skillId: string; name: string; proficiency: number }[];
  targetSkills: { skillId: string; name: string; proficiency: number }[];
  reputationScore: number;
  targetReputationScore: number;
  profileCompleteness: number;
  targetProfileCompleteness: number;
  lastActive: Date | null;
  targetLastActive: Date | null;
  createdAt: Date;
  targetCreatedAt: Date;
  location: string | null;
  targetLocation: string | null;
}

export interface MatchScoreResult {
  overallScore: number;
  breakdown: Record<string, number>;
}

export interface MatchingStrategy {
  name: string;
  weight: number;
  score(input: MatchScoreInput): number;
}
