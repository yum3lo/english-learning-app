// Common shape every source fetcher normalizes into before shared processing
// (dedup -> CEFR tagging -> storage) in processAndStore.ts.
export interface RawArticle {
  externalId: string;   // stable unique key for dedup, e.g. "guardian:<id>" or "wikipedia:<title>"
  source: string;        // human-readable publication, e.g. "The Guardian", "Wikipedia"
  title: string;
  description?: string;
  body: string;           // article content, markdown/plain text (matches how Media.content.content is rendered)
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  category?: string;      // one of constants/categories.ts CATEGORIES, if known
  tags?: string[];
}
