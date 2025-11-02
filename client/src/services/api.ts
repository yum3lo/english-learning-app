import axios from 'axios';
import type { MediaItem, UnifiedMediaItem } from '@/data/mediaData';
import type { CEFRLevel } from '@/constants/categories';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const mediaAPI = {
  getRecommendations: async (params: {
    type?: 'article' | 'video';
    limit?: number;
  }): Promise<{ success: boolean; count: number; recommendations: MediaItem[] }> => {
    const response = await api.get('/media/recommendations', { params });
    return response.data;
  },

  getFeed: async (params: {
    type?: 'article' | 'video';
    limit?: number;
  }): Promise<{ success: boolean; count: number; items: MediaItem[] }> => {
    const response = await api.get('/media/feed', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; media: UnifiedMediaItem }> => {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  search: async (query: string, type?: 'article' | 'video'): Promise<{ success: boolean; count: number; results: MediaItem[] }> => {
    const response = await api.get('/media/search', {
      params: { q: query, type }
    });
    return response.data;
  },

  getByCategory: async (category: string): Promise<{ success: boolean; count: number; category: string; media: MediaItem[] }> => {
    const response = await api.get(`/media/category/${category}`);
    return response.data;
  },
  fetchGuardianArticles: async (params?: { category?: string; limit?: number }) => {
    const response = await api.get('/media/guardian/fetch', { params });
    return response.data;
  },
};

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await api.put('/users/profile', data);
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
    word: string;
    definition: string;
    partOfSpeech: string;
    example?: string;
    pronunciation?: string;
  }) => {
    const response = await api.post('/users/learned-word', wordData);
    return response.data;
  },
};

export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    dateOfBirth: string;
    cefrLevel: CEFRLevel;
    fieldsOfInterest: string[];
    consentAI: boolean;
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

export const syncAPI = {
  getStatus: async () => {
    const response = await api.get('/sync/status');
    return response.data;
  },

  triggerSync: async (params?: {
    categories?: string[];
    articlesPerCategory?: number;
  }) => {
    const response = await api.post('/sync/trigger', params);
    return response.data;
  },
};

export default api;