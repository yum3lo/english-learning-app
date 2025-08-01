import mongoose, { Document, Schema } from 'mongoose';
import { ACTIVITY_TYPES } from '../constants/categories';

export interface IUserProgress extends Document {
  _id: string;
  userId: string;
  mediaId: mongoose.Types.ObjectId;
  activityType: 'read' | 'watched' | 'vocabulary_click' | 'flashcard_review';
  completedAt?: Date;
  progressPercentage: number;
  
  flashcardResults?: {
    totalAttempts: number;
    correctAnswers: number;
  };
  
  aiScore?: number; // 0-100
  aiSuggestions?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  mediaId: {
    type: Schema.Types.ObjectId,
    ref: 'Media',
    required: true
  },
  activityType: {
    type: String,
    enum: ACTIVITY_TYPES,
    required: true
  },
  completedAt: {
    type: Date
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  flashcardResults: {
    totalAttempts: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 }
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiSuggestions: [String]
}, {
  timestamps: true
});

userProgressSchema.index({ userId: 1, createdAt: -1 });
userProgressSchema.index({ userId: 1, mediaId: 1 });
userProgressSchema.index({ userId: 1, activityType: 1 });

export default mongoose.model<IUserProgress>('UserProgress', userProgressSchema);
