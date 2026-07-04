// date-only helpers for displaying spaced-repetition due status, uses the browser's local calendar day

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((stripTime(to).getTime() - stripTime(from).getTime()) / msPerDay);
}

export function isDue(nextReviewDate: string): boolean {
  return daysBetween(new Date(), new Date(nextReviewDate)) <= 0;
}

// first two successful reviews use fixed per-difficulty steps rather than easeFactor,
// since interval*easeFactor isn't meaningful yet (interval starts at 0)
// mirrors server/src/utils/spacedRepetition.ts's reviewWord interval math exactly
const FIRST_REVIEW_STEPS: Record<number, number> = { 3: 2, 4: 3, 5: 4 };
const SECOND_REVIEW_STEPS: Record<number, number> = { 3: 3, 4: 7, 5: 14 };

// predicts the interval (in days) a review would produce, without persisting anything
export function previewInterval(
  state: { interval: number; repetitions: number; easeFactor: number },
  quality: number
): number {
  if (quality < 3) return 1;

  const repetitions = state.repetitions + 1;
  if (repetitions === 1) return FIRST_REVIEW_STEPS[quality];
  if (repetitions === 2) return SECOND_REVIEW_STEPS[quality];

  // ease updates first so it can shape this round's interval too, not just future ones
  let easeFactor = state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return Math.round(state.interval * easeFactor);
}
