import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { CATEGORIES, CEFR_LEVELS } from '../constants/categories';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  cefrLevel: 'B2' | 'C1' | 'C2';
  fieldsOfInterest: string[];
  aiDataConsent: boolean;
  learningProgress: {
    cefrScores: {
      B2: number;
      C1: number;
      C2: number;
    };
    wordsLearned: number;
    articlesRead: number;
    videosWatched: number;
  };
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
  aiDataConsent: {
    type: Boolean,
    default: false
  },
  learningProgress: {
    cefrScores: {
      B2: { type: Number, default: 0 },
      C1: { type: Number, default: 0 },
      C2: { type: Number, default: 0 }
    },
    wordsLearned: { type: Number, default: 0 },
    articlesRead: { type: Number, default: 0 },
    videosWatched: { type: Number, default: 0 }
  }
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