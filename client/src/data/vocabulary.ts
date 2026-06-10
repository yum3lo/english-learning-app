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

// shape of a populated VocabularyWord doc (server/src/models/Vocabulary.ts)
export interface PopulatedVocabularyWord {
  _id: string;
  word: string;
  definition: string;
  phonetic?: string;
  partOfSpeech: string;
  exampleSentences?: string[];
  synonyms?: string[];
  antonyms?: string[];
  cefrLevel: CEFRLevel;
}

export const vocabularyData: Record<string, VocabularyItem[]> = {};

// converting learned words to vocabulary items
export const convertLearnedWordsToVocabulary = (learnedWords: {
  wordId: PopulatedVocabularyWord;
  exampleInText?: string;
  learnedAt: Date;
}[]): VocabularyItem[] => {
  return learnedWords.map(lw => ({
    word: lw.wordId.word,
    definition: lw.wordId.definition,
    partOfSpeech: lw.wordId.partOfSpeech,
    example: lw.wordId.exampleSentences?.[0],
    exampleInText: lw.exampleInText,
    pronunciation: lw.wordId.phonetic || 'No pronunciation available',
    cefrLevel: lw.wordId.cefrLevel,
  }));
};