import type { DictionaryEntry } from '@/types/dictionary';

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

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
      const entries = await this.getWordDefinition(word);
      return entries[0] || null;
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
