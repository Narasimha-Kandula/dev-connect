import { Injectable } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';

@Injectable()
export class LocationStrategy implements MatchingStrategy {
  name = 'location';
  weight = 0.10;

  score(input: MatchScoreInput): number {
    if (!input.location || !input.targetLocation) return 0.3;

    const a = input.location.toLowerCase().trim();
    const b = input.targetLocation.toLowerCase().trim();

    if (a === b) return 1;

    const aParts = a.split(',').map((p) => p.trim());
    const bParts = b.split(',').map((p) => p.trim());

    const overlap = aParts.filter((p) => bParts.includes(p)).length;
    if (overlap > 0) return 0.6;

    return 0.1;
  }
}
