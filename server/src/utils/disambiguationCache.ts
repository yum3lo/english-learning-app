import { createHash } from 'crypto';
import type { DisambiguationResult } from '../services/senseDisambiguationService';

const MAX_ENTRIES = 500;
const cache = new Map<string, DisambiguationResult>();

function cacheKey(surfaceForm: string, sentence: string): string {
  return createHash('sha256').update(`${surfaceForm}|${sentence}`).digest('hex');
}

export function getCachedDisambiguation(surfaceForm: string, sentence: string): DisambiguationResult | undefined {
  return cache.get(cacheKey(surfaceForm, sentence));
}

export function setCachedDisambiguation(surfaceForm: string, sentence: string, result: DisambiguationResult): void {
  const key = cacheKey(surfaceForm, sentence);
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, result);
}
