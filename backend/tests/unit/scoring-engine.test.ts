import { ScoringEngine } from '../../src/modules/matching/strategies/scoring-engine';
import { MatchingStrategy, MatchScoreInput } from '../../src/modules/matching/strategies/matching-strategy.interface';

describe('ScoringEngine', () => {
  const mockStrategy = (name: string, weight: number, score: number): MatchingStrategy => ({
    name,
    weight,
    score: () => score,
  });

  it('returns 0 when no strategies are registered', () => {
    const engine = new ScoringEngine([]);
    const result = engine.calculate({} as MatchScoreInput);
    expect(result.overallScore).toBe(0);
    expect(result.breakdown).toEqual({});
  });

  it('computes weighted average from a single strategy', () => {
    const engine = new ScoringEngine([mockStrategy('skills', 1.0, 0.85)]);
    const result = engine.calculate({} as MatchScoreInput);
    expect(result.overallScore).toBe(85);
    expect(result.breakdown).toEqual({ skills: 0.85 });
  });

  it('computes weighted average from multiple strategies', () => {
    const engine = new ScoringEngine([
      mockStrategy('skills', 2.0, 0.9),
      mockStrategy('location', 1.0, 0.5),
    ]);
    const result = engine.calculate({} as MatchScoreInput);
    const expected = Math.round(((0.9 * 2 + 0.5 * 1) / 3) * 10000) / 100;
    expect(result.overallScore).toBe(expected);
    expect(result.breakdown.skills).toBe(0.9);
    expect(result.breakdown.location).toBe(0.5);
  });

  it('caps overall score at 100', () => {
    const engine = new ScoringEngine([mockStrategy('skills', 1.0, 1.5)]);
    const result = engine.calculate({} as MatchScoreInput);
    expect(result.overallScore).toBe(100);
  });

  it('rounds breakdown values to 2 decimal places', () => {
    const engine = new ScoringEngine([mockStrategy('skills', 1.0, 0.123456)]);
    const result = engine.calculate({} as MatchScoreInput);
    expect(result.breakdown.skills).toBe(0.12);
  });

  it('handles zero total weight gracefully', () => {
    const engine = new ScoringEngine([mockStrategy('empty', 0, 0.5)]);
    const result = engine.calculate({} as MatchScoreInput);
    expect(result.overallScore).toBe(0);
  });
});
