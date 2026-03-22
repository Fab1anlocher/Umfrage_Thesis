export function getDecisionStyleBucket(score: number): 'rational' | 'emotional' {
  return score >= 4 ? 'emotional' : 'rational';
}

export function getBannerAssignment(
  group: 'A' | 'B',
  initiativeId: 1 | 2
): { aType: 'personalized' | 'neutral'; bType: 'personalized' | 'neutral' } {
  // Crossover design:
  // Group A: Initiative 1 = Neutral first (A), Initiative 2 = Personalized first (A)
  // Group B: Initiative 1 = Personalized first (A), Initiative 2 = Neutral first (A)
  if (group === 'A') {
    if (initiativeId === 1) return { aType: 'neutral', bType: 'personalized' };
    return { aType: 'personalized', bType: 'neutral' };
  } else {
    if (initiativeId === 1) return { aType: 'personalized', bType: 'neutral' };
    return { aType: 'neutral', bType: 'personalized' };
  }
}
