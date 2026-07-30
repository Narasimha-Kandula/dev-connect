import { Injectable } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';

@Injectable()
export class ActivityLevelStrategy implements MatchingStrategy {
  name = 'activity_level';
  weight = 0.15;

  score(input: MatchScoreInput): number {
    const now = Date.now();

    const lastActiveA = input.lastActive ? now - input.lastActive.getTime() : Infinity;
    const lastActiveB = input.targetLastActive ? now - input.targetLastActive.getTime() : Infinity;

    const avgRecencyMs = Math.min(lastActiveA, lastActiveB);

    if (avgRecencyMs < 60 * 60 * 1000) return 1;
    if (avgRecencyMs < 24 * 60 * 60 * 1000) return 0.8;
    if (avgRecencyMs < 7 * 24 * 60 * 60 * 1000) return 0.5;
    if (avgRecencyMs < 30 * 24 * 60 * 60 * 1000) return 0.2;

    return 0;
  }
}
