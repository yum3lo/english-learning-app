export interface DictionaryPhonetic {
  text: string;
  audio?: string;
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  origin?: string;
  meanings: DictionaryMeaning[];
}

export interface LearnedWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  example?: string;
  pronunciation?: string;
  learnedAt: Date;
}
