import { Injectable } from '@nestjs/common';
import { MatchingStrategy, MatchScoreInput } from './matching-strategy.interface';

const ROLE_CLUSTERS: Record<string, string[]> = {
  frontend: ['react', 'next.js', 'vue', 'angular', 'css', 'html', 'typescript', 'javascript', 'ui/ux'],
  backend: ['node.js', 'nestjs', 'python', 'go', 'rust', 'java', 'postgresql', 'mongodb', 'graphql', 'rest'],
  devops: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'ansible', 'jenkins'],
  mobile: ['react native', 'flutter', 'swift', 'kotlin', 'android'],
  ml: ['tensorflow', 'pytorch', 'ai/ml', 'python', 'data science', 'nlp'],
};

@Injectable()
export class ComplementaryRoleStrategy implements MatchingStrategy {
  name = 'complementary_roles';
  weight = 0.25;

  score(input: MatchScoreInput): number {
    const myRoles = this.detectRoles(input.skills.map((s) => s.name.toLowerCase()));
    const targetRoles = this.detectRoles(input.targetSkills.map((s) => s.name.toLowerCase()));

    if (myRoles.length === 0 || targetRoles.length === 0) return 0;

    const complementaryPairs: [string, string][] = [
      ['frontend', 'backend'],
      ['backend', 'frontend'],
      ['backend', 'devops'],
      ['frontend', 'mobile'],
      ['ml', 'backend'],
      ['devops', 'backend'],
      ['mobile', 'backend'],
    ];

    let score = 0;
    for (const [myRole, targetRole] of complementaryPairs) {
      if (myRoles.includes(myRole) && targetRoles.includes(targetRole)) {
        score += 1;
      }
    }

    const hasOverlap = myRoles.some((r) => targetRoles.includes(r));
    if (hasOverlap) score += 0.3;

    return Math.min(score / complementaryPairs.length, 1);
  }

  private detectRoles(skills: string[]): string[] {
    const roles: string[] = [];
    for (const [role, keywords] of Object.entries(ROLE_CLUSTERS)) {
      if (skills.some((s) => keywords.some((kw) => s.includes(kw)))) {
        roles.push(role);
      }
    }
    return roles;
  }
}
