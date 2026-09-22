import Media from '../models/Media';
import { classifyTextWithOpenAI } from '../services/cefrClassificationService';
import { countWords, estimateReadingMinutes, stripHtml } from '../utils/text';
import { RawArticle } from './types';

const MIN_WORD_COUNT = 200; // roughly the old 1200-plain-text-character floor used for Guardian articles

export interface IngestionSummary {
  fetched: number;
  skippedDuplicate: number;
  skippedTooShort: number;
  skippedTaggingFailed: number;
  stored: number;
}

// Shared by every source fetcher: skip duplicates before paying for a model call,
// validate body length, CEFR-tag once, then persist. Never called at read time.
export async function processAndStore(articles: RawArticle[]): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    fetched: articles.length,
    skippedDuplicate: 0,
    skippedTooShort: 0,
    skippedTaggingFailed: 0,
    stored: 0,
  };

  for (const article of articles) {
    if (!article.body || !article.url || !article.externalId) continue;

    const exists = await Media.exists({ externalId: article.externalId });
    if (exists) {
      summary.skippedDuplicate++;
      continue;
    }

    const plainText = stripHtml(article.body);
    const wordCount = countWords(plainText);
    if (wordCount < MIN_WORD_COUNT) {
      summary.skippedTooShort++;
      continue;
    }

    let cefrLevel;
    let cefrReasoning = '';
    let category = 'General';
    try {
      const result = await classifyTextWithOpenAI(plainText);
      cefrLevel = result.level;
      cefrReasoning = result.rationale;
      category = result.category;
    } catch (err) {
      console.error(`[pipeline] CEFR tagging failed for "${article.title}":`, err instanceof Error ? err.message : err);
      summary.skippedTaggingFailed++;
      continue;
    }

    try {
      await Media.create({
        title: article.title,
        type: 'article',
        url: article.url,
        thumbnailUrl: article.imageUrl,
        source: article.source,
        externalId: article.externalId,
        description: article.description,
        content: { content: article.body },
        cefrLevel,
        cefrReasoning,
        categories: [category],
        tags: article.tags,
        wordCount,
        readingMinutes: estimateReadingMinutes(wordCount),
        publishedAt: article.publishedAt,
        language: 'en',
      });
      summary.stored++;
    } catch (err) {
      console.error(`[pipeline] failed to store article "${article.title}":`, err instanceof Error ? err.message : err);
    }
  }

  return summary;
}
