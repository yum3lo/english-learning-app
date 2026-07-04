export type Stage = 'seedling' | 'growing' | 'bloomed';

export interface SRSState {
  interval: number;
  repetitions: number;
  easeFactor: number;
}

export interface SRSResult extends SRSState {
  nextReviewDate: Date;
  lastReviewedAt: Date;
  stage: Stage;
}

export const DEFAULT_SRS_FIELDS: SRSState = {
  interval: 0,
  repetitions: 0,
  easeFactor: 2.5,
};

// normalizes a date to midnight UTC so "due today" comparisons don't break across timezones
export function stripTime(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function deriveStage(repetitions: number): Stage {
  if (repetitions <= 1) return 'seedling';
  if (repetitions <= 3) return 'growing';
  return 'bloomed';
}

// first two successful reviews use fixed steps (per difficulty) rather than easeFactor,
// since interval*easeFactor isn't meaningful yet (interval starts at 0)
// in sync with client/src/lib/srs.ts's previewInterval
const FIRST_REVIEW_STEPS: Record<number, number> = { 3: 2, 4: 3, 5: 4 };
const SECOND_REVIEW_STEPS: Record<number, number> = { 3: 3, 4: 7, 5: 14 };

export function reviewWord(state: SRSState, quality: number, referenceDate: Date = new Date()): SRSResult {
  let { interval, repetitions, easeFactor } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;

    // ease updates first so it can shape this round's interval too, not just future ones
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    if (repetitions === 1) interval = FIRST_REVIEW_STEPS[quality];
    else if (repetitions === 2) interval = SECOND_REVIEW_STEPS[quality];
    else interval = Math.round(interval * easeFactor);
  }

  const today = stripTime(referenceDate);

  return {
    interval,
    repetitions,
    easeFactor,
    lastReviewedAt: today,
    nextReviewDate: addDays(today, interval),
    stage: deriveStage(repetitions),
  };
}
