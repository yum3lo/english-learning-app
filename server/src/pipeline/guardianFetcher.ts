import guardianAPI from '../api/guardianAPI';
import { CATEGORIES } from '../constants/categories';
import { RawArticle } from './types';

const PAGE_SIZE_PER_CATEGORY = 8;

// Iterates every app category (not a fixed subset of raw Guardian sections) so a user who
// picks any interest - Economy, History, Art, whatever - has a chance of getting Guardian
// content for it. guardianAPI.fetchArticles already maps each category to a keyword search.
export async function fetchGuardian(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  for (const category of CATEGORIES) {
    try {
      const results = await guardianAPI.fetchArticles({
        category,
        pageSize: PAGE_SIZE_PER_CATEGORY,
        orderBy: 'newest',
      });
      for (const item of results) {
        if (!item.id || !item.url || !item.content) continue;
        // tag with the category we searched for, not just Guardian's own section mapping -
        // an article found via the "History" search may live in a section (e.g. "world")
        // whose own mapping wouldn't include History at all
        const tags = Array.from(new Set([category, ...(item.categories ?? [])]));
        articles.push({
          externalId: `guardian:${item.id}`,
          source: 'The Guardian',
          title: item.title,
          description: item.description,
          body: item.content,
          url: item.url,
          imageUrl: item.thumbnailUrl,
          publishedAt: item.publishedDate,
          category,
          tags,
        });
      }
    } catch (err) {
      console.error(`[pipeline] guardian category "${category}" failed:`, err instanceof Error ? err.message : err);
    }
  }

  return articles;
}
