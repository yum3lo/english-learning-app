import axios from 'axios';
import { convertHtmlToMarkdown } from '../utils/htmlToMarkdown';
import { RawArticle } from './types';

// Wikipedia asks anonymous API consumers to identify themselves via User-Agent
const USER_AGENT = process.env.WIKIPEDIA_USER_AGENT || 'EnglishLearningApp/1.0 (contact not configured)';

// Used whenever a Wikipedia article has no page image, so cards never render with a broken/empty thumbnail
export const WIKIPEDIA_FALLBACK_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/8/80/Wikipedia-logo-v2.svg';

// Keys must be valid entries in constants/categories.ts CATEGORIES
const WIKIPEDIA_TOPICS: Record<string, string> = {
  Flora: 'Plants',
  Fauna: 'Animals',
  Science: 'Science',
  History: 'History',
  Art: 'Art',
  Geography: 'Geography',
  Technology: 'Technology',
  Food: 'Food and drink',
  Travel: 'Travel',
  Culture: 'Culture',
};

const MAX_ARTICLES_PER_TOPIC = 3;
const MIN_BODY_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 220;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wikipedia's anonymous-tier rate limit responds with 429 + a Retry-After header - honor it
// once instead of just giving up, since one retry after the cooldown recovers most requests
// that only failed because a burst of earlier calls (in this run or another one) tripped it.
async function getWithRetry<T>(url: string, config: Record<string, unknown>, retriesLeft = 1): Promise<{ data: T }> {
  try {
    return await axios.get<T>(url, config);
  } catch (err: any) {
    if (retriesLeft > 0 && err?.response?.status === 429) {
      const retryAfterSeconds = parseInt(err.response.headers?.['retry-after'], 10);
      const waitMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 5000;
      await sleep(waitMs);
      return getWithRetry<T>(url, config, retriesLeft - 1);
    }
    throw err;
  }
}

// Strips markdown syntax down to a short plain-text teaser, for articles that don't come
// with a natural description (only the "featured article of the day" does).
export function deriveDescription(markdown: string, maxLength = DESCRIPTION_MAX_LENGTH): string {
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

export interface ArticleContent {
  body: string;
  imageUrl?: string;
}

// Fetches the HTML extract (converted to markdown, so headings/lists/paragraphs render
// properly) and a page thumbnail in one request - no explaintext, so extracts come back as
// real markup instead of an unstructured wall of text.
export async function fetchArticleContent(title: string): Promise<ArticleContent | null> {
  try {
    const res = await getWithRetry<any>('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        titles: title,
        prop: 'extracts|pageimages',
        piprop: 'thumbnail',
        pithumbsize: 500,
        format: 'json',
      },
      headers: { 'User-Agent': USER_AGENT },
    });
    const pages = res.data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as any;
    if (!page || page.missing !== undefined || !page.extract) return null;

    return {
      body: convertHtmlToMarkdown(page.extract),
      imageUrl: page.thumbnail?.source,
    };
  } catch (err) {
    console.error(`[pipeline] wikipedia content fetch failed for "${title}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function fetchFeaturedArticle(): Promise<RawArticle | null> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  try {
    const res = await getWithRetry<any>(
      `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${dateStr}`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    const fa = res.data?.tfa;
    if (!fa?.title) return null;

    const content = await fetchArticleContent(fa.title);
    if (!content || content.body.length < MIN_BODY_LENGTH) return null;

    return {
      externalId: `wikipedia:${fa.title}`,
      source: 'Wikipedia',
      title: fa.titles?.normalized || fa.title,
      description: fa.extract,
      body: content.body,
      url: fa.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(fa.title)}`,
      imageUrl: fa.thumbnail?.source || content.imageUrl || WIKIPEDIA_FALLBACK_IMAGE_URL,
      publishedAt: new Date(),
      category: 'General',
      tags: ['featured'],
    };
  } catch (err) {
    console.error('[pipeline] wikipedia featured article fetch failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function fetchTopicArticles(category: string, wikiCategory: string): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  try {
    const res = await getWithRetry<any>('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${wikiCategory}`,
        cmlimit: MAX_ARTICLES_PER_TOPIC * 2,
        cmtype: 'page',
        format: 'json',
      },
      headers: { 'User-Agent': USER_AGENT },
    });

    const pages = (res.data?.query?.categorymembers ?? []).slice(0, MAX_ARTICLES_PER_TOPIC);
    for (const page of pages) {
      const content = await fetchArticleContent(page.title);
      if (!content || content.body.length < MIN_BODY_LENGTH) continue;

      articles.push({
        externalId: `wikipedia:${page.title}`,
        source: 'Wikipedia',
        title: page.title,
        description: deriveDescription(content.body),
        body: content.body,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        imageUrl: content.imageUrl || WIKIPEDIA_FALLBACK_IMAGE_URL,
        publishedAt: new Date(),
        category,
        tags: [category],
      });

      await sleep(300); // be polite to Wikipedia between article fetches
    }
  } catch (err) {
    console.error(`[pipeline] wikipedia category "${wikiCategory}" failed:`, err instanceof Error ? err.message : err);
  }

  return articles;
}

// Wikipedia's anonymous-tier rate limit is easy to trip with back-to-back category calls -
// without a pause between topics, only the first one or two of WIKIPEDIA_TOPICS would ever
// succeed before every later request in the same run started 429ing.
const DELAY_BETWEEN_TOPICS_MS = 1000;

export async function fetchWikipedia(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  const featured = await fetchFeaturedArticle();
  if (featured) articles.push(featured);

  for (const [category, wikiCategory] of Object.entries(WIKIPEDIA_TOPICS)) {
    await sleep(DELAY_BETWEEN_TOPICS_MS);
    const topicArticles = await fetchTopicArticles(category, wikiCategory);
    articles.push(...topicArticles);
  }

  return articles;
}
