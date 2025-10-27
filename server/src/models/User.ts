import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { CATEGORIES, CEFR_LEVELS, CEFRLevel } from '../constants/categories';

export interface LearnedWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  example?: string;
  pronunciation?: string;
  learnedAt: Date;
}

export interface CompletedMedia {
  mediaId: string;
  mediaType: 'article' | 'video';
  completedAt: Date;
}

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  cefrLevel: CEFRLevel;
  fieldsOfInterest: string[];
  points: number;
  wordsLearned: number;
  articlesRead: number;
  videosWatched: number;
  learnedWords: LearnedWord[];
  completedMedia: CompletedMedia[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [20, 'Name cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  cefrLevel: {
    type: String,
    enum: CEFR_LEVELS,
    default: 'B2'
  },
  fieldsOfInterest: [{
    type: String,
    enum: CATEGORIES
  }],
  points: {
    type: Number,
    default: 0
  },
  wordsLearned: {
    type: Number,
    default: 0
  },
  articlesRead: {
    type: Number,
    default: 0
  },
  videosWatched: {
    type: Number,
    default: 0
  },
  learnedWords: [{
    word: {
      type: String,
      required: true
    },
    definition: {
      type: String,
      required: true
    },
    partOfSpeech: {
      type: String,
      required: true
    },
    example: String,
    pronunciation: String,
    learnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedMedia: [{
    mediaId: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['article', 'video'],
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// hashing password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUser>('User', userSchema);