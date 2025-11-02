import mongoose, { Document, Schema } from 'mongoose';
import { CATEGORIES, CEFR_LEVELS, MEDIA_TYPES, CEFRLevel } from '../constants/categories';

export interface IMedia extends Document {
  _id: string;
  title: string;
  type: 'video' | 'article';
  url: string;
  thumbnailUrl?: string;
  source: string;
  description?: string;
  duration?: number;
  transcription?: string;
  content?: {
    content?: string;
    videoUrl?: string;
    transcript?: string;
  };
  cefrLevel: CEFRLevel;
  categories: string[];
  vocabularyWords: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: MEDIA_TYPES,
    required: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  duration: {
    type: Number,
    min: 0
  },
  transcription: {
    type: String,
    trim: true
  },
  content: {
    content: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    transcript: { type: String, trim: true }
  },
  cefrLevel: {
    type: String,
    enum: CEFR_LEVELS,
    required: true
  },
  categories: [{
    type: String,
    enum: CATEGORIES,
  }],
  vocabularyWords: [{
    type: Schema.Types.ObjectId,
    ref: 'VocabularyWord'
  }]
}, {
  timestamps: true
});

// indexes for better query performance
mediaSchema.index({ cefrLevel: 1, categories: 1 });
mediaSchema.index({ type: 1, cefrLevel: 1 });
mediaSchema.index({ source: 1 });
mediaSchema.index({ createdAt: -1 });

export default mongoose.model<IMedia>('Media', mediaSchema);