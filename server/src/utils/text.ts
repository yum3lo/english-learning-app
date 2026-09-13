export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
};

export const stripHtml = (html?: string): string => {
  if (!html) return '';
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).trim();
};

export const escapeRegExp = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const estimateReadingMinutes = (wordCount: number): number => {
  return Math.max(1, Math.round(wordCount / 200));
};
