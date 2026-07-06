import type { CEFRLevel } from '@/constants/categories';
import type { DictionarySense } from '@/types/dictionary';

export type { DictionarySense } from '@/types/dictionary';
export type MasteryStage = 'seedling' | 'growing' | 'bloomed';
export type SourceMediaType = 'article' | 'video';

export interface VocabularyItem {
  word: string;
  definition: string;
  partOfSpeech: string;
  lemma: string;
  pronunciation: string;
  audioUrl?: string;
  sourceSentence?: string;
  sourceMediaType?: SourceMediaType;
  sourceIsModel: boolean;
  allSenses?: DictionarySense[];
  cefrLevel: CEFRLevel;
  wordId: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
  stage: MasteryStage;
}

// shape of a populated VocabularyWord doc (server/src/models/Vocabulary.ts)
export interface PopulatedVocabularyWord {
  _id: string;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  senses?: DictionarySense[];
  cefrLevel: CEFRLevel;
}

export const vocabularyData: Record<string, VocabularyItem[]> = {};

// converting learned words to vocabulary items - reads the context sense chosen once at lookup
// time and stored on the learned word itself, not the shared (multi-sense) dictionary entry
export const convertLearnedWordsToVocabulary = (learnedWords: {
  wordId: PopulatedVocabularyWord;
  learnedAt: Date;
  interval?: number;
  repetitions?: number;
  easeFactor?: number;
  nextReviewDate?: string;
  lastReviewedAt?: string;
  stage?: MasteryStage;
  surfaceForm?: string;
  lemma?: string;
  partOfSpeech?: string;
  definition?: string;
  pronunciation?: string;
  audioUrl?: string;
  sourceSentence?: string;
  sourceMediaType?: SourceMediaType;
  sourceIsModel?: boolean;
  allSenses?: DictionarySense[];
}[]): VocabularyItem[] => {
  return learnedWords.map(lw => ({
    word: lw.surfaceForm ?? lw.wordId.word,
    definition: lw.definition ?? 'No definition available',
    partOfSpeech: lw.partOfSpeech ?? 'unknown',
    lemma: lw.lemma ?? lw.wordId.word,
    pronunciation: lw.pronunciation || 'No pronunciation available',
    audioUrl: lw.audioUrl,
    sourceSentence: lw.sourceSentence,
    sourceMediaType: lw.sourceMediaType,
    sourceIsModel: lw.sourceIsModel ?? false,
    allSenses: lw.allSenses,
    cefrLevel: lw.wordId.cefrLevel,
    wordId: lw.wordId._id,
    interval: lw.interval ?? 0,
    repetitions: lw.repetitions ?? 0,
    easeFactor: lw.easeFactor ?? 2.5,
    nextReviewDate: lw.nextReviewDate ?? new Date().toISOString(),
    lastReviewedAt: lw.lastReviewedAt,
    stage: lw.stage ?? 'seedling',
  }));
};