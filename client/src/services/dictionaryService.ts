import type { DictionaryEntry } from '@/types/dictionary';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DICTIONARY_API_BASE = `${API_BASE}/dictionary`;

export class DictionaryService {
  static async getWordDefinition(word: string, sentence?: string): Promise<DictionaryEntry[]> {
    try {
      const query = sentence ? `?sentence=${encodeURIComponent(sentence)}` : '';
      const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(word.toLowerCase())}${query}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch definition for "${word}"`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dictionary API error:', error);
      throw new Error(`Could not find definition for "${word}"`);
    }
  }

  static async getWordWithFallback(word: string, sentence?: string): Promise<DictionaryEntry | null> {
    try {
      const result = await this.getWordDefinition(word, sentence);
      if ((result as any).entry) return (result as any).entry as DictionaryEntry;
      if (Array.isArray(result) && result.length > 0) return result[0] as DictionaryEntry;
      return null;
    } catch (error) {
      console.error('Failed to get word definition:', error);
      return null;
    }
  }
}