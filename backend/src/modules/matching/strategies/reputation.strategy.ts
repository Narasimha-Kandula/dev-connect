import { Injectable } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';

@Injectable()
export class ReputationStrategy implements MatchingStrategy {
  name = 'reputation';
  weight = 0.15;

  score(input: MatchScoreInput): number {
    const avgRep = (input.reputationScore + input.targetReputationScore) / 2;
    const maxProfileComplete = Math.max(input.profileCompleteness, input.targetProfileCompleteness);

    const repScore = Math.min(avgRep / 100, 1);
    const profileScore = maxProfileComplete / 100;

    return repScore * 0.5 + profileScore * 0.5;
  }
}
