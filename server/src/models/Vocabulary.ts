import mongoose, { Document, Schema } from 'mongoose';
import { CEFR_LEVELS, CEFRLevel } from '../constants/categories';

export interface IVocabularyWord extends Document {
  _id: string;
  word: string;
  definition: string;
  phonetic: string;
  cefrLevel: CEFRLevel;
  partOfSpeech: string;
  
  exampleSentences: string[];
  synonyms: string[];
  antonyms: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserVocabulary extends Document {
  _id: string;
  userId: string;
  wordId: mongoose.Types.ObjectId;
  
  // context where the word was encountered
  mediaId?: mongoose.Types.ObjectId;
  sentence: string;
  sentencePosition?: number; // in the media transcription
  
  createdAt: Date;
  updatedAt: Date;
}

const vocabularyWordSchema = new Schema<IVocabularyWord>({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },
  definition: {
    type: String,
    required: [true, 'Definition is required'],
    trim: true
  },
  phonetic: {
    type: String,
    trim: true
  },
  cefrLevel: {
    type: String,
    enum: CEFR_LEVELS,
    required: true
  },
  partOfSpeech: {
    type: String,
    required: true,
    trim: true
  },
  exampleSentences: [String],
  synonyms: [String],
  antonyms: [String]
}, {
  timestamps: true
});

export const VocabularyWord = mongoose.model<IVocabularyWord>('VocabularyWord', vocabularyWordSchema);