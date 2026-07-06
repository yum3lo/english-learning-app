import mongoose, { Document, Schema } from 'mongoose';
import { CEFR_LEVELS, CEFRLevel } from '../constants/categories';

export interface ISense {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface IVocabularyWord extends Document {
  _id: string;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  cefrLevel: CEFRLevel;
  senses: ISense[];

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

const senseSchema = new Schema<ISense>({
  partOfSpeech: {
    type: String,
    required: true,
    trim: true
  },
  definition: {
    type: String,
    required: true,
    trim: true
  },
  example: String,
  synonyms: [String],
  antonyms: [String]
}, { _id: false });

const vocabularyWordSchema = new Schema<IVocabularyWord>({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },
  phonetic: {
    type: String,
    trim: true
  },
  audioUrl: {
    type: String,
    trim: true
  },
  cefrLevel: {
    type: String,
    enum: CEFR_LEVELS,
    required: true
  },
  senses: {
    type: [senseSchema],
    default: []
  }
}, {
  timestamps: true
});

export const VocabularyWord = mongoose.model<IVocabularyWord>('VocabularyWord', vocabularyWordSchema);