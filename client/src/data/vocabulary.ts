import type { CEFRLevel } from '@/constants/categories';

export interface VocabularyItem {
  word: string;
  definition: string;
  partOfSpeech: string;
  example?: string;
  exampleInText?: string;
  pronunciation: string;
  cefrLevel: CEFRLevel;
}

export const vocabularyData: Record<string, VocabularyItem[]> = {};

// converting learned words to vocabulary items
export const convertLearnedWordsToVocabulary = (learnedWords: {
  word: string;
  definition: string;
  partOfSpeech: string;
  example?: string;
  exampleInText?: string;
  pronunciation?: string;
  learnedAt: Date;
}[]): VocabularyItem[] => {
  return learnedWords.map(word => ({
    word: word.word,
    definition: word.definition,
    partOfSpeech: word.partOfSpeech,
    example: word.example || undefined,
    exampleInText: word.exampleInText || undefined,
    pronunciation: word.pronunciation || 'No pronunciation available',
    cefrLevel: 'B2' as CEFRLevel
  }));
};