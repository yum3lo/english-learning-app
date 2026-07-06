export interface DictionaryPhonetic {
  text: string;
  audio?: string;
}

export interface DictionarySense {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryContext {
  lemma: string;
  partOfSpeech: string;
  definition: string;
  bestSenseIndex: number;
  sourceIsModel: boolean;
}

export interface DictionaryEntry {
  _id?: string;
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  senses: DictionarySense[];
  context: DictionaryContext | null;
}
