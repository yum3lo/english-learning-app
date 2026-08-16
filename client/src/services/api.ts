import axios from 'axios';
import type { MediaItem, UnifiedMediaItem } from '@/data/mediaData';
import type { CEFRLevel } from '@/constants/categories';
import type { DictionarySense, SourceMediaType } from '@/data/vocabulary';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const mediaAPI = {
  getRecommendations: async (params: {
    type?: 'article' | 'video';
    limit?: number;
    page?: number;
  }): Promise<{ success: boolean; count: number; recommendations: MediaItem[]; pagination: Pagination }> => {
    const response = await api.get('/media/recommendations', { params });
    return response.data;
  },

  getFeed: async (params: {
    type?: 'article' | 'video';
    limit?: number;
    page?: number;
  }): Promise<{ success: boolean; count: number; items: MediaItem[]; pagination: Pagination }> => {
    const response = await api.get('/media/feed', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; media: UnifiedMediaItem }> => {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  search: async (query: string, type?: 'article' | 'video', params?: { limit?: number; page?: number }): Promise<{ success: boolean; count: number; results: MediaItem[]; pagination: Pagination }> => {
    const response = await api.get('/media/search', {
      params: { q: query, type, ...params }
    });
    return response.data;
  },

  getByCategory: async (category: string, params?: { limit?: number; page?: number }): Promise<{ success: boolean; count: number; category: string; media: MediaItem[]; pagination: Pagination }> => {
    const response = await api.get(`/media/category/${category}`, { params });
    return response.data;
  },
  fetchGuardianArticles: async (params?: { category?: string; limit?: number }) => {
    const response = await api.get('/media/guardian/fetch', { params });
    return response.data;
  },
  fetchYoutubeVideos: async (params?: { category?: string; limit?: number }) => {
    // formatting and classifying each new video via OpenAI can take a while, so allow more time
    const response = await api.get('/media/youtube/fetch', { params, timeout: 120000 });
    return response.data;
  },
  addVideoWithTranscript: async (videoData: {
    title: string;
    url: string;
    source?: string;
    description?: string;
    thumbnail?: string;
    transcript?: string;
    categories?: string[];
  }) => {
    const response = await api.post('/media/videos/add-with-transcript', videoData);
    return response.data;
  },
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || fallback;
  }
  return fallback;
};

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 401)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/profile');
    return response.data;
  },

  recordWordLearned: async () => {
    const response = await api.post('/users/progress/word-learned');
    return response.data;
  },

  recordMediaCompletion: async (mediaType: 'article' | 'video', mediaId: string) => {
    const response = await api.post('/users/progress/media-completed', {
      mediaType,
      mediaId
    });
    return response.data;
  },

  addLearnedWord: async (wordData: {
    wordId: string;
    surfaceForm: string;
    lemma: string;
    partOfSpeech: string;
    definition: string;
    pronunciation?: string;
    audioUrl?: string;
    sourceSentence?: string;
    sourceMediaType?: SourceMediaType;
    sourceIsModel?: boolean;
    allSenses?: DictionarySense[];
  }) => {
    const response = await api.post('/users/learned-word', wordData);
    return response.data;
  },

  reviewWord: async (wordId: string, quality: number) => {
    const response = await api.patch(`/users/learned-word/${wordId}/review`, { quality });
    return response.data;
  },

  checkFlashcardAnswer: async (wordId: string, mode: 'word' | 'definition', answer: string) => {
    const response = await api.post(`/users/learned-word/${wordId}/check-answer`, { mode, answer });
    return response.data;
  },
};

export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    cefrLevel: CEFRLevel;
    fieldsOfInterest: string[];
    createdAt: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

export const cefrAPI = {
  classifyMedia: async (mediaId: string) => {
    const response = await api.post('/cefr/classify-media', { mediaId });
    return response.data;
  },

  classifyAll: async () => {
    const response = await api.post('/cefr/classify-all');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/cefr/status');
    return response.data;
  },
};

export default api;