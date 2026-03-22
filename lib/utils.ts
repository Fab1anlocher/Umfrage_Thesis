/**
 * Maps a numeric decision-style score (1–5) to a bucket label.
 * Scores of 4 or 5 → 'emotional', scores of 1–3 → 'rational'.
 * Used to select the matching personalised banner from the DB.
 */
export function getDecisionStyleBucket(score: number): 'rational' | 'emotional' {
  return score >= 4 ? 'emotional' : 'rational';
}

/**
 * Returns the banner type assignment for each slot (A / B) based on the
 * crossover design:
 *
 *   Group A — Initiative 1: A = neutral,      B = personalized
 *   Group A — Initiative 2: A = personalized,  B = neutral
 *   Group B — Initiative 1: A = personalized,  B = neutral
 *   Group B — Initiative 2: A = neutral,       B = personalized
 *
 * This ensures every participant sees both a neutral and a personalized
 * banner, and that the order is counterbalanced across groups and initiatives.
 */
export function getBannerAssignment(
  group: 'A' | 'B',
  initiativeId: 1 | 2
): { aType: 'personalized' | 'neutral'; bType: 'personalized' | 'neutral' } {
  if (group === 'A') {
    if (initiativeId === 1) return { aType: 'neutral', bType: 'personalized' };
    return { aType: 'personalized', bType: 'neutral' };
  } else {
    if (initiativeId === 1) return { aType: 'personalized', bType: 'neutral' };
    return { aType: 'neutral', bType: 'personalized' };
  }
}
