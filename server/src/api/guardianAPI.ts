import axios from 'axios';

interface GuardianArticle {
  id: string;
  type: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    headline?: string;
    trailText?: string;
    thumbnail?: string;
    body?: string;
    bodyText?: string;
    wordcount?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    total: number;
    results: GuardianArticle[];
  };
}

export interface ProcessedArticle {
  title: string;
  url: string;
  thumbnailUrl?: string;
  source: string;
  description: string;
  content: string;
  categories: string[];
  publishedDate: Date;
  wordCount?: number;
}

class GuardianAPI {
  private apiKey: string;
  private baseUrl = 'https://content.guardianapis.com';

  constructor() {
    this.apiKey = process.env.GUARDIAN_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Guardian API key not found in environment variables');
    }
  }

  private mapSectionToCategory(sectionName: string): string[] {
    const sectionMap: Record<string, string[]> = {
      'general': ['General'],
      'economy': ['Economy'],
      'politics': ['Politics'],
      'business': ['Business'],
      'world': ['Geography', 'Politics'],
      'science': ['Science'],
      'environment': ['Environment', 'Geography'],
      'technology': ['Technology', 'Science'],
      'sport': ['Sports'],
      'football': ['Sports'],
      'culture': ['Culture', 'Cinema', 'Literature'],
      'film': ['Cinema', 'Culture'],
      'books': ['Literature', 'Culture'],
      'music': ['Culture'],
      'lifeandstyle': ['Lifestyle'],
      'travel': ['Geography', 'Culture'],
      'money': ['Economy', 'Business'],
      'education': ['Education'],
      'society': ['Society'],
      'law': ['Politics', 'Society'],
      'media': ['Media', 'Technology'],
      'global-development': ['Society', 'Geography'],
      'australia-news': ['Geography', 'Politics'],
      'uk-news': ['Geography', 'Politics'],
      'us-news': ['Geography', 'Politics']
    };

    const normalizedSection = sectionName.toLowerCase();
    return sectionMap[normalizedSection] || ['General'];
  }

  private getCategorySearchTerms(category: string): string {
    const searchTerms: Record<string, string> = {
      'Politics': 'politics OR government OR election',
      'Economy': 'economy OR business OR finance OR trade',
      'Geography': 'world OR international OR global',
      'Science': 'science OR research OR discovery',
      'Environment': 'environment OR climate OR nature OR sustainability',
      'Technology': 'technology OR digital OR innovation',
      'Sports': 'sport OR football OR tennis OR olympics',
      'Culture': 'culture OR arts OR entertainment',
      'Cinema': 'film OR cinema OR movies',
      'Literature': 'books OR literature OR writing',
      'History': 'history OR heritage',
      'Health': 'health OR medicine OR wellness'
    };

    return searchTerms[category] || category.toLowerCase();
  }

  async fetchArticles(options: {
    category?: string;
    pageSize?: number;
    page?: number;
    orderBy?: 'newest' | 'oldest' | 'relevance';
    fromDate?: Date;
  }): Promise<ProcessedArticle[]> {
    try {
      const {
        category,
        pageSize = 20,
        page = 1,
        orderBy = 'newest',
        fromDate
      } = options;

      const params: any = {
        'api-key': this.apiKey,
        'show-fields': 'headline,trailText,thumbnail,body,bodyText,wordcount',
        'page-size': pageSize,
        page,
        'order-by': orderBy
      };

      if (category) {
        params.q = this.getCategorySearchTerms(category);
      }

      if (fromDate) {
        params['from-date'] = fromDate.toISOString().split('T')[0];
      }

      const response = await axios.get<GuardianResponse>(
        `${this.baseUrl}/search`,
        { params }
      );

      if (response.data.response.status !== 'ok') {
        throw new Error('Guardian API request failed');
      }

      return this.processArticles(response.data.response.results);
    } catch (error) {
      console.error('Error fetching Guardian articles:', error);
      throw error;
    }
  }

  async fetchBySection(
    section: string,
    pageSize: number = 20
  ): Promise<ProcessedArticle[]> {
    try {
      const params: any = {
        'api-key': this.apiKey,
        'show-fields': 'headline,trailText,thumbnail,body,bodyText,wordcount',
        'page-size': pageSize,
        section
      };

      const response = await axios.get<GuardianResponse>(
        `${this.baseUrl}/search`,
        { params }
      );

      if (response.data.response.status !== 'ok') {
        throw new Error('Guardian API request failed');
      }

      return this.processArticles(response.data.response.results);
    } catch (error) {
      console.error(`Error fetching Guardian section ${section}:`, error);
      throw error;
    }
  }

  async searchArticles(
    query: string,
    pageSize: number = 20
  ): Promise<ProcessedArticle[]> {
    try {
      const params = {
        'api-key': this.apiKey,
        'show-fields': 'headline,trailText,thumbnail,body,bodyText,wordcount',
        'page-size': pageSize,
        q: query
      };

      const response = await axios.get<GuardianResponse>(
        `${this.baseUrl}/search`,
        { params }
      );

      if (response.data.response.status !== 'ok') {
        throw new Error('Guardian API search failed');
      }

      return this.processArticles(response.data.response.results);
    } catch (error) {
      console.error('Error searching Guardian articles:', error);
      throw error;
    }
  }

  private convertHtmlToMarkdown(html: string): string {
    if (!html) return '';

    let text = html;
    text = text.replace(/\r\n|\r/g, '\n');
    text = text.replace(/<p[^>]*>/gi, '\n\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<br\s*\/?>(\s*)/gi, '\n');
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
    text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\*\*\s*\*\*/g, '');
    text = text.replace(/\*\s*\*/g, '');

    return text.trim();
  }

  private processArticles(articles: GuardianArticle[]): ProcessedArticle[] {
    return articles
      .filter(article => (article.fields?.body || article.fields?.bodyText))
      .map(article => {
        const rawHtml = article.fields?.body || article.fields?.bodyText || '';
        const content = article.fields?.body ? this.convertHtmlToMarkdown(rawHtml) : rawHtml;

        return {
          title: article.fields?.headline || article.webTitle,
          url: article.webUrl,
          thumbnailUrl: article.fields?.thumbnail,
          source: 'The Guardian',
          description: article.fields?.trailText || '',
          content,
          categories: this.mapSectionToCategory(article.sectionName),
          publishedDate: new Date(article.webPublicationDate),
          wordCount: article.fields?.wordcount 
            ? parseInt(article.fields.wordcount) 
            : undefined
        } as ProcessedArticle;
      });
  }

  async getRecommendedArticles(
    interests: string[],
    limit: number = 10
  ): Promise<ProcessedArticle[]> {
    try {
      const articlePromises = interests.slice(0, 3).map(interest =>
        this.fetchArticles({
          category: interest,
          pageSize: Math.ceil(limit / interests.length),
          orderBy: 'newest'
        })
      );

      const results = await Promise.all(articlePromises);
      const allArticles = results.flat();

      return this.shuffleArray(allArticles).slice(0, limit);
    } catch (error) {
      console.error('Error getting recommended articles:', error);
      throw error;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default new GuardianAPI();