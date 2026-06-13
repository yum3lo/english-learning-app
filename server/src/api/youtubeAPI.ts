import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';
import { decodeHtmlEntities } from '../utils/text';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeVideoDetailsItem {
  id: string;
  snippet?: { description?: string };
  contentDetails: { duration: string };
}

interface YouTubeVideosResponse {
  items: YouTubeVideoDetailsItem[];
}

export interface ProcessedVideo {
  title: string;
  url: string;
  thumbnailUrl?: string;
  source: string;
  description: string;
  categories: string[];
  publishedDate: Date;
  duration?: number;
}

class YouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key not found in environment variables');
    }
  }

  private getCategorySearchTerms(category: string): string {
    const searchTerms: Record<string, string> = {
      'General': 'interesting facts explained',
      'Language': 'english learning lesson',
      'Economy': 'economics explained',
      'Environment': 'environment documentary',
      'Politics': 'politics explained',
      'Geography': 'geography documentary',
      'Fauna': 'wildlife documentary',
      'Flora': 'plants and nature documentary',
      'History': 'history documentary',
      'Cinema': 'film analysis video essay',
      'Literature': 'book review literature',
      'Sports': 'sports documentary',
      'Technology': 'technology explained',
      'Science': 'science documentary',
      'Art': 'art documentary',
      'Music': 'music documentary',
      'Food': 'food documentary',
      'Travel': 'travel documentary',
      'Health': 'health explained',
      'Culture': 'culture documentary'
    };

    return searchTerms[category] || 'english documentary';
  }

  private parseDuration(iso: string): number | undefined {
    const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async searchVideos(category?: string, maxResults: number = 10): Promise<ProcessedVideo[]> {
    try {
      const searchResponse = await axios.get<YouTubeSearchResponse>(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          type: 'video',
          q: this.getCategorySearchTerms(category || 'General'),
          maxResults,
          order: 'relevance',
          relevanceLanguage: 'en',
          safeSearch: 'moderate',
          videoCaption: 'closedCaption'
        }
      });

      const items = (searchResponse.data.items || []).filter(item => item.id?.videoId);
      if (items.length === 0) return [];

      const videoIds = items.map(item => item.id.videoId);
      const durationByVideoId = new Map<string, number | undefined>();
      const descriptionByVideoId = new Map<string, string | undefined>();

      const detailsResponse = await axios.get<YouTubeVideosResponse>(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          part: 'snippet,contentDetails',
          id: videoIds.join(',')
        }
      });

      for (const item of detailsResponse.data.items || []) {
        durationByVideoId.set(item.id, this.parseDuration(item.contentDetails.duration));
        descriptionByVideoId.set(item.id, item.snippet?.description);
      }

      return items.map(item => ({
        title: decodeHtmlEntities(item.snippet.title),
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails?.high?.url
          || item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url,
        source: item.snippet.channelTitle,
        description: decodeHtmlEntities(descriptionByVideoId.get(item.id.videoId) ?? item.snippet.description),
        categories: category ? [category] : ['General'],
        publishedDate: new Date(item.snippet.publishedAt),
        duration: durationByVideoId.get(item.id.videoId)
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  }

  // fetching a diverse mix of videos across the given interest categories (falling back to 'General')
  async getRecommendedVideos(interests: string[], limit: number = 10): Promise<ProcessedVideo[]> {
    const categories = interests.length > 0 ? interests.slice(0, 5) : ['General'];
    const perCategory = Math.max(1, Math.ceil(limit / categories.length));

    const videoArrays = await Promise.all(
      categories.map(category => this.searchVideos(category, perCategory).catch(error => {
        console.error(`Error fetching YouTube videos for category ${category}:`, error);
        return [];
      }))
    );

    const seenUrls = new Set<string>();
    const videos: ProcessedVideo[] = [];
    for (const video of videoArrays.flat()) {
      if (!seenUrls.has(video.url)) {
        seenUrls.add(video.url);
        videos.push(video);
      }
    }

    return videos;
  }

  // not all videos have captions available, and the available English
  // track may be a regional variant (e.g. en-US) rather than plain 'en'
  async fetchTranscriptText(videoId: string): Promise<string | undefined> {
    const languageCandidates = ['en', 'en-US', 'en-GB'];

    for (const lang of languageCandidates) {
      try {
        const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        const text = decodeHtmlEntities(segments.map(segment => segment.text).join(' ')).replace(/\s+/g, ' ').trim();
        if (text.length > 0) return text;
      } catch {
        // try the next language candidate
      }
    }

    console.warn(`No English transcript available for video ${videoId}`);
    return undefined;
  }
}

export default new YouTubeAPI();
