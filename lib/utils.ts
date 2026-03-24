/**
 * Returns the banner type a participant sees for a given initiative,
 * based on the crossover design:
 *
 *   Group A — Initiative 1: personalized
 *   Group A — Initiative 2: neutral
 *   Group B — Initiative 1: neutral
 *   Group B — Initiative 2: personalized
 *
 * Every participant sees one banner per initiative. Across both initiatives
 * each participant experiences both conditions (personalized + neutral),
 * counterbalanced between groups.
 */
export function getBannerAssignment(
  group: 'A' | 'B',
  initiativeId: 1 | 2
): 'personalized' | 'neutral' {
  if (group === 'A') {
    return initiativeId === 1 ? 'personalized' : 'neutral';
  } else {
    return initiativeId === 1 ? 'neutral' : 'personalized';
  }
}
