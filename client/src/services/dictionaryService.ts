import type { DictionaryEntry } from '@/types/dictionary';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DICTIONARY_API_BASE = `${API_BASE}/dictionary`;

export class DictionaryService {
  static async getWordDefinition(word: string): Promise<DictionaryEntry[]> {
    try {
      const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(word.toLowerCase())}`);
      
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

  static async getWordWithFallback(word: string): Promise<DictionaryEntry | null> {
    try {
      const result = await this.getWordDefinition(word);
      if ((result as any).entry) return (result as any).entry as DictionaryEntry;
      if (Array.isArray(result) && result.length > 0) return result[0] as DictionaryEntry;
      return null;
    } catch (error) {
      console.error('Failed to get word definition:', error);
      return null;
    }
  }

  static formatDefinitionForStorage(entry: DictionaryEntry): {
    word: string;
    definition: string;
    partOfSpeech: string;
    example?: string;
    pronunciation?: string;
  } {
    const firstMeaning = entry.meanings[0];
    const firstDefinition = firstMeaning?.definitions[0];
    
    return {
      word: entry.word,
      definition: firstDefinition?.definition || 'No definition available',
      partOfSpeech: firstMeaning?.partOfSpeech || 'unknown',
      example: firstDefinition?.example,
      pronunciation: entry.phonetic || entry.phonetics[0]?.text
    };
  }
}