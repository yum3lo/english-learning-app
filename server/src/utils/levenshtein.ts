import { distance } from 'fastest-levenshtein';
// porter-stemmer ships no type declarations - typed require avoids ambient-module resolution
// differences between tsc and ts-node
const { stemmer }: { stemmer: (word: string) => string } = require('porter-stemmer');

export type CheckVerdict = 'correct' | 'incorrect';

export interface WordModeResult {
  verdict: CheckVerdict;
  spellingIssue: boolean;
  spellingCorrection?: string;
}

export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/^[^\w]+|[^\w]+$/g, '');
}

// tolerance scales with target length so short words aren't over-forgiven
// ("cat" vs "cot" should not pass; "equipped" vs "equiped" should)
function toleranceFor(targetLength: number): number {
  if (targetLength <= 4) return 1;
  if (targetLength <= 8) return 2;
  return 3;
}

export function checkWordMode(answer: string, target: string): WordModeResult {
  const a = normalize(answer);
  const t = normalize(target);

  if (a === t) return { verdict: 'correct', spellingIssue: false };

  // a different inflected form of the same word ("seek" for "seeking", "run" for "running")
  // isn't a typo - stemming both sides catches this regardless of how far apart the literal
  // strings are, and regardless of which form happens to be stored as the target (the stored
  // "lemma" is only as good as what the dictionary/model returned, and often isn't a true
  // linguistic root - see e.g. "seeking", whose own lemma field is just "seeking")
  if (a.length > 3 && t.length > 3 && stemmer(a) === stemmer(t)) {
    return { verdict: 'correct', spellingIssue: false };
  }

  const dist = distance(a, t);
  const tolerance = toleranceFor(t.length);

  if (dist <= tolerance) {
    return { verdict: 'correct', spellingIssue: true, spellingCorrection: target };
  }

  return { verdict: 'incorrect', spellingIssue: false };
}

// word mode accepts either the lemma or the inflected surface form as fully correct - the
// definition being quizzed is the dictionary (lemma) sense, so answering with the lemma isn't
// a "misspelling" of the surface form, it's just a different valid form of the same word
export function checkWordModeAgainstTargets(answer: string, targets: string[]): WordModeResult {
  const uniqueTargets = Array.from(new Set(targets.filter(Boolean)));
  const a = normalize(answer);

  if (uniqueTargets.some(t => normalize(t) === a)) {
    return { verdict: 'correct', spellingIssue: false };
  }

  for (const target of uniqueTargets) {
    const result = checkWordMode(answer, target);
    if (result.verdict === 'correct') return result;
  }

  return { verdict: 'incorrect', spellingIssue: false };
}

// fallback for definition-mode grading when the LLM call fails - same normalize+distance
// mechanics as checkWordMode, but against the (longer) reference definition text, so no
// spelling nuance is surfaced, just a coarse correct/incorrect
export function fallbackCheck(answer: string, reference: string): CheckVerdict {
  const a = normalize(answer);
  const r = normalize(reference);

  if (a === r) return 'correct';

  const dist = distance(a, r);
  return dist <= toleranceFor(r.length) ? 'correct' : 'incorrect';
}
