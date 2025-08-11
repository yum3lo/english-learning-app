import articlesData from './articles.json';
import videosData from './videos.json';
import { vocabularyData, type VocabularyItem } from './vocabulary';
import { mediaContentData } from './mediaContent';
import type { CEFRLevel } from '@/constants/categories';

export interface MediaItem {
  _id: string;
  title: string;
  type: 'article' | 'video';
  url: string;
  source: string;
  description: string;
  imageUrl?: string;
  cefrLevel: CEFRLevel;
  categories: string[];
  duration?: string;
  createdAt: string;
}

export interface MediaContent {
  _id: string;
  content?: string;
  videoUrl?: string;
  transcript?: string;
}

export interface UnifiedMediaItem extends MediaItem {
  content?: MediaContent;
  vocabulary: VocabularyItem[];
}

class MediaDataService {
  private static instance: MediaDataService;
  private allMediaItems: MediaItem[];
  private mediaContentMap: Record<string, MediaContent>;
  private vocabularyMap: Record<string, VocabularyItem[]>;

  private constructor() {
    this.allMediaItems = [...articlesData, ...videosData] as MediaItem[];
    this.mediaContentMap = mediaContentData;
    this.vocabularyMap = vocabularyData;
  }

  public static getInstance(): MediaDataService {
    if (!MediaDataService.instance) {
      MediaDataService.instance = new MediaDataService();
    }
    return MediaDataService.instance;
  }

  public getAllMedia(): MediaItem[] {
    return this.allMediaItems;
  }

  public getMediaById(id: string): UnifiedMediaItem | null {
    const mediaItem = this.allMediaItems.find(item => item._id === id);
    if (!mediaItem) return null;

    return {
      ...mediaItem,
      content: this.mediaContentMap[id],
      vocabulary: this.vocabularyMap[id] || []
    };
  }

  public getMediaByCategory(category: string): MediaItem[] {
    return this.allMediaItems.filter(item => 
      item.categories.includes(category)
    );
  }

  public getMediaByType(type: 'article' | 'video'): MediaItem[] {
    return this.allMediaItems.filter(item => item.type === type);
  }

  public getMediaByLevel(level: CEFRLevel): MediaItem[] {
    return this.allMediaItems.filter(item => item.cefrLevel === level);
  }

  public getVocabularyForMedia(id: string, level?: CEFRLevel): VocabularyItem[] {
    const vocabulary = this.vocabularyMap[id] || [];
    if (level) {
      return vocabulary.filter(vocab => vocab.cefrLevel === level);
    }
    return vocabulary;
  }

  public searchMedia(query: string): MediaItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.allMediaItems.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery)) ||
      item.source.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const mediaDataService = MediaDataService.getInstance();
export default mediaDataService;
