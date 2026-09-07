import { fetchGuardian } from './guardianFetcher';
import { fetchWikipedia } from './wikipediaFetcher';
import { processAndStore } from './processAndStore';
import { RawArticle } from './types';

// Add a new source by writing a fetcher here that returns RawArticle[] - dedup, tagging,
// and storage in processAndStore.ts is shared and never needs to change.
const SOURCE_FETCHERS: Record<string, () => Promise<RawArticle[]>> = {
  guardian: fetchGuardian,
  wikipedia: fetchWikipedia,
};

export async function runIngestionPipeline(): Promise<void> {
  console.log('[pipeline] starting', new Date().toISOString());

  const entries = Object.entries(SOURCE_FETCHERS);
  const results = await Promise.allSettled(entries.map(([, fetch]) => fetch()));

  for (let i = 0; i < results.length; i++) {
    const [name] = entries[i];
    const result = results[i];

    if (result.status === 'rejected') {
      console.error(`[pipeline] ${name} failed:`, result.reason instanceof Error ? result.reason.message : result.reason);
      continue;
    }

    try {
      const summary = await processAndStore(result.value);
      console.log(`[pipeline] ${name}:`, summary);
    } catch (err) {
      console.error(`[pipeline] ${name} processing failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('[pipeline] done', new Date().toISOString());
}
