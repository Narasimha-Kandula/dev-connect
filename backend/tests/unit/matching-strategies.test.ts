import { SkillMatchStrategy } from '../../src/modules/matching/strategies/skill-match.strategy';
import { ComplementaryRoleStrategy } from '../../src/modules/matching/strategies/complementary-role.strategy';
import { ActivityLevelStrategy } from '../../src/modules/matching/strategies/activity-level.strategy';
import { ReputationStrategy } from '../../src/modules/matching/strategies/reputation.strategy';
import { LocationStrategy } from '../../src/modules/matching/strategies/location.strategy';
import { ScoringEngine } from '../../src/modules/matching/strategies/scoring-engine';
import { MatchScoreInput } from '../../src/modules/matching/strategies/matching-strategy.interface';

function makeInput(overrides: Partial<MatchScoreInput> = {}): MatchScoreInput {
  return {
    userId: 'user-a',
    targetUserId: 'user-b',
    skills: [],
    targetSkills: [],
    reputationScore: 0,
    targetReputationScore: 0,
    profileCompleteness: 0,
    targetProfileCompleteness: 0,
    lastActive: new Date(),
    targetLastActive: new Date(),
    createdAt: new Date(),
    targetCreatedAt: new Date(),
    location: null,
    targetLocation: null,
    ...overrides,
  };
}

describe('SkillMatchStrategy', () => {
  const strategy = new SkillMatchStrategy();

  it('should score 0 when no skills overlap', () => {
    const input = makeInput({
      skills: [{ skillId: '1', name: 'React', proficiency: 4 }],
      targetSkills: [{ skillId: '2', name: 'Python', proficiency: 3 }],
    });
    expect(strategy.score(input)).toBe(0);
  });

  it('should score > 0 when skills overlap with proficiency', () => {
    const input = makeInput({
      skills: [
        { skillId: '1', name: 'React', proficiency: 5 },
        { skillId: '2', name: 'TypeScript', proficiency: 4 },
      ],
      targetSkills: [
        { skillId: '1', name: 'React', proficiency: 4 },
        { skillId: '3', name: 'Node.js', proficiency: 5 },
      ],
    });
    const score = strategy.score(input);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('ComplementaryRoleStrategy', () => {
  const strategy = new ComplementaryRoleStrategy();

  it('should score high for complementary roles (frontend + backend)', () => {
    const input = makeInput({
      skills: [{ skillId: '1', name: 'React', proficiency: 4 }],
      targetSkills: [{ skillId: '2', name: 'Node.js', proficiency: 4 }],
    });
    const score = strategy.score(input);
    expect(score).toBeGreaterThan(0);
  });

  it('should score medium for overlapping roles', () => {
    const input = makeInput({
      skills: [{ skillId: '1', name: 'React', proficiency: 4 }],
      targetSkills: [{ skillId: '2', name: 'Vue', proficiency: 4 }],
    });
    const score = strategy.score(input);
    expect(score).toBeGreaterThan(0);
  });

  it('should score 0 when roles are unknown', () => {
    const input = makeInput({
      skills: [{ skillId: '1', name: 'UnknownSkill', proficiency: 4 }],
      targetSkills: [{ skillId: '2', name: 'AnotherUnknown', proficiency: 4 }],
    });
    expect(strategy.score(input)).toBe(0);
  });
});

describe('ActivityLevelStrategy', () => {
  const strategy = new ActivityLevelStrategy();

  it('should score 1 for recently active users', () => {
    const input = makeInput({
      lastActive: new Date(),
      targetLastActive: new Date(),
    });
    expect(strategy.score(input)).toBe(1);
  });

  it('should score 0 for users inactive over 30 days', () => {
    const input = makeInput({
      lastActive: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      targetLastActive: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    });
    expect(strategy.score(input)).toBe(0);
  });
});

describe('ReputationStrategy', () => {
  const strategy = new ReputationStrategy();

  it('should score higher for high reputation users', () => {
    const high = strategy.score(makeInput({
      reputationScore: 80,
      targetReputationScore: 70,
      profileCompleteness: 90,
      targetProfileCompleteness: 85,
    }));
    const low = strategy.score(makeInput({
      reputationScore: 10,
      targetReputationScore: 5,
      profileCompleteness: 20,
      targetProfileCompleteness: 15,
    }));
    expect(high).toBeGreaterThan(low);
  });
});

describe('LocationStrategy', () => {
  const strategy = new LocationStrategy();

  it('should score 1 for exact same location', () => {
    const input = makeInput({
      location: 'San Francisco, CA',
      targetLocation: 'San Francisco, CA',
    });
    expect(strategy.score(input)).toBe(1);
  });

  it('should score 0.6 for same region', () => {
    const input = makeInput({
      location: 'San Francisco, CA',
      targetLocation: 'Oakland, CA',
    });
    expect(strategy.score(input)).toBe(0.6);
  });

  it('should score 0.3 when both have no location', () => {
    const input = makeInput({
      location: null,
      targetLocation: null,
    });
    expect(strategy.score(input)).toBe(0.3);
  });
});

describe('ScoringEngine', () => {
  it('should combine all strategies with correct weights', () => {
    const strategies = [
      new SkillMatchStrategy(),
      new ComplementaryRoleStrategy(),
      new ActivityLevelStrategy(),
      new ReputationStrategy(),
      new LocationStrategy(),
    ];

    const engine = new ScoringEngine(strategies);

    const input = makeInput({
      skills: [
        { skillId: '1', name: 'React', proficiency: 5 },
        { skillId: '2', name: 'TypeScript', proficiency: 4 },
      ],
      targetSkills: [
        { skillId: '1', name: 'React', proficiency: 4 },
        { skillId: '3', name: 'Node.js', proficiency: 5 },
      ],
      reputationScore: 60,
      targetReputationScore: 70,
      profileCompleteness: 80,
      targetProfileCompleteness: 75,
      location: 'San Francisco',
      targetLocation: 'San Francisco',
    });

    const result = engine.calculate(input);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.breakdown).toHaveProperty('skill_match');
    expect(result.breakdown).toHaveProperty('complementary_roles');
    expect(result.breakdown).toHaveProperty('activity_level');
    expect(result.breakdown).toHaveProperty('reputation');
    expect(result.breakdown).toHaveProperty('location');
  });
});
