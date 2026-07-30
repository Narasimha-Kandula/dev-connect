import { Injectable, Inject } from '@nestjs/common';
import {
  MatchingStrategy,
  MatchScoreInput,
  MatchScoreResult,
} from './matching-strategy.interface';

@Injectable()
export class ScoringEngine {
  constructor(
    @Inject('MATCHING_STRATEGIES')
    private readonly strategies: MatchingStrategy[],
  ) {}

  calculate(input: MatchScoreInput): MatchScoreResult {
    const breakdown: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const strategy of this.strategies) {
      const score = strategy.score(input);
      breakdown[strategy.name] = Math.round(score * 100) / 100;
      totalWeightedScore += score * strategy.weight;
      totalWeight += strategy.weight;
    }

    const overallScore = totalWeight > 0
      ? Math.round((totalWeightedScore / totalWeight) * 10000) / 100
      : 0;

    return {
      overallScore: Math.min(overallScore, 100),
      breakdown,
    };
  }
}
