import { Injectable } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';

@Injectable()
export class SkillMatchStrategy implements MatchingStrategy {
  name = 'skill_match';
  weight = 0.35;

  score(input: MatchScoreInput): number {
    const mySkillIds = new Set(input.skills.map((s) => s.skillId));
    const targetSkillIds = new Set(input.targetSkills.map((s) => s.skillId));

    const overlap = [...mySkillIds].filter((id) => targetSkillIds.has(id)).length;
    const union = new Set([...mySkillIds, ...targetSkillIds]).size;

    if (union === 0) return 0;

    const jaccard = overlap / union;
    const avgProficiency = input.skills
      .filter((s) => targetSkillIds.has(s.skillId))
      .reduce((sum, s) => sum + s.proficiency, 0) / Math.max(overlap, 1) / 5;

    return (jaccard * 0.7 + avgProficiency * 0.3);
  }
}
