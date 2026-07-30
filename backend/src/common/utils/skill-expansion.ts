const SKILL_ALIASES: Record<string, string[]> = {
  'mern': ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
  'mern stack': ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
  'mean': ['MongoDB', 'Express.js', 'Angular', 'Node.js'],
  'mean stack': ['MongoDB', 'Express.js', 'Angular', 'Node.js'],
  'mevn': ['MongoDB', 'Express.js', 'Vue.js', 'Node.js'],
  'mevn stack': ['MongoDB', 'Express.js', 'Vue.js', 'Node.js'],
  'jamstack': ['JavaScript', 'APIs', 'Markup'],
  'lamp': ['Linux', 'Apache', 'MySQL', 'PHP'],
  'lamp stack': ['Linux', 'Apache', 'MySQL', 'PHP'],
  'full stack': ['Frontend', 'Backend', 'Database', 'DevOps'],
  'web dev': ['HTML', 'CSS', 'JavaScript', 'TypeScript'],
  'ai/ml': ['Python', 'TensorFlow', 'Machine Learning', 'AI'],
  'golang': ['Go'],
  'reactjs': ['React.js'],
  'react js': ['React.js'],
  'nodejs': ['Node.js'],
  'node js': ['Node.js'],
  'expressjs': ['Express.js'],
  'express js': ['Express.js'],
  'typescript': ['TypeScript'],
  'postgresql': ['PostgreSQL'],
  'nextjs': ['Next.js'],
  'next js': ['Next.js'],
  'nestjs': ['NestJS'],
  'nest js': ['NestJS'],
};

export function expandSkillName(name: string): string {
  const normalized = name.toLowerCase().trim();
  const expanded = SKILL_ALIASES[normalized];
  if (expanded) return expanded[0];
  return name;
}

export function expandSkillNames(names: string[]): string[] {
  const result: string[] = [];
  for (const name of names) {
    const normalized = name.toLowerCase().trim();
    const expanded = SKILL_ALIASES[normalized];
    if (expanded) {
      result.push(...expanded);
    } else {
      result.push(name);
    }
  }
  return [...new Set(result)];
}

export function getExpandedSkillTerms(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  return SKILL_ALIASES[normalized] ?? [name];
}

export { SKILL_ALIASES };
