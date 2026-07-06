import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { reviewWord, stripTime, DEFAULT_SRS_FIELDS } from '../utils/spacedRepetition';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const user = await User.findById(userId).populate('learnedWords.wordId');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cefrLevel: user.cefrLevel,
        fieldsOfInterest: user.fieldsOfInterest,
        points: user.points,
        wordsLearned: user.wordsLearned,
        articlesRead: user.articlesRead,
        videosWatched: user.videosWatched,
        learnedWords: user.learnedWords,
        completedMedia: user.completedMedia,
        streakCount: user.streakCount,
        lastStreakDate: user.lastStreakDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticate,  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Name must be between 2 and 20 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const { name, email } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
        return;
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cefrLevel: user.cefrLevel,
        fieldsOfInterest: user.fieldsOfInterest,
        points: user.points,
        wordsLearned: user.wordsLearned,
        articlesRead: user.articlesRead,
        videosWatched: user.videosWatched,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account'
    });
  }
});

// @route   POST /api/users/progress/word-learned
// @desc    Increment words learned count
// @access  Private
router.post('/progress/word-learned', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    user.wordsLearned += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Word learned count updated',
      wordsLearned: user.wordsLearned
    });
  } catch (error) {
    console.error('Update words learned error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating words learned'
    });
  }
});

// @route   POST /api/users/progress/media-completed
// @desc    Mark media as completed (article read or video watched)
// @access  Private
router.post('/progress/media-completed', [
  authenticate,
  body('mediaType')
    .isIn(['article', 'video'])
    .withMessage('Media type must be either article or video'),
  body('mediaId')
    .notEmpty()
    .withMessage('Media ID is required')
], async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const { mediaType, mediaId } = req.body;
    const alreadyCompleted = user.completedMedia.some(
      media => media.mediaId === mediaId && media.mediaType === mediaType
    );

    if (alreadyCompleted) {
      res.status(400).json({
        success: false,
        message: 'Media already completed'
      });
      return;
    }

    user.completedMedia.push({
      mediaId,
      mediaType,
      completedAt: new Date()
    });

    if (mediaType === 'article') {
      user.articlesRead += 1;
    } else if (mediaType === 'video') {
      user.videosWatched += 1;
    }

    user.points += 5;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${mediaType} completion recorded`,
      articlesRead: user.articlesRead,
      videosWatched: user.videosWatched,
      points: user.points
    });
  } catch (error) {
    console.error('Update media completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating media completion'
    });
  }
});

// @route   POST /api/users/learned-word
// @desc    Add a word to user's learned words
// @access  Private
router.post('/learned-word',
  authenticate,
  [
    body('wordId').isMongoId().withMessage('A valid wordId is required'),
    body('surfaceForm').notEmpty().isString().withMessage('surfaceForm is required'),
    body('lemma').notEmpty().isString().withMessage('lemma is required'),
    body('partOfSpeech').notEmpty().isString().withMessage('partOfSpeech is required'),
    body('definition').notEmpty().isString().withMessage('definition is required'),
    body('pronunciation').optional().isString(),
    body('audioUrl').optional().isString(),
    body('sourceSentence').optional().isString(),
    body('sourceMediaType').optional().isIn(['article', 'video']),
    body('sourceIsModel').optional().isBoolean(),
    body('allSenses').optional().isArray()
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const {
        wordId, surfaceForm, lemma, partOfSpeech, definition,
        pronunciation, audioUrl, sourceSentence, sourceMediaType, sourceIsModel, allSenses
      } = req.body;

      const alreadyLearned = user.learnedWords.some(w => w.wordId.toString() === wordId);
      if (alreadyLearned) {
        res.status(400).json({
          success: false,
          message: 'Word already exists in learned words'
        });
        return;
      }
      user.learnedWords.push({
        wordId,
        learnedAt: new Date(),
        ...DEFAULT_SRS_FIELDS,
        nextReviewDate: stripTime(new Date()),
        stage: 'seedling',
        surfaceForm,
        lemma,
        partOfSpeech,
        definition,
        pronunciation,
        audioUrl,
        sourceSentence,
        sourceMediaType,
        sourceIsModel: sourceIsModel ?? false,
        allSenses
      });
      user.wordsLearned += 1;
      await user.save();

      await user.populate('learnedWords.wordId');
      const lastLearned = user.learnedWords[user.learnedWords.length - 1];
      res.status(200).json({
        success: true,
        message: 'Word added to learned words',
        wordsLearned: user.wordsLearned,
        points: user.points,
        learnedWord: lastLearned
      });
    } catch (error) {
      console.error('Add learned word error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error adding learned word'
      });
    }
  }
);

// @route   PATCH /api/users/learned-word/:wordId/review
// @desc    Submit a flashcard review for a learned word, advancing its SRS state
// @access  Private
router.patch('/learned-word/:wordId/review',
  authenticate,
  [
    param('wordId').isMongoId().withMessage('A valid wordId is required'),
    body('quality').isInt({ min: 0, max: 5 }).withMessage('quality must be an integer between 0 and 5')
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const { wordId } = req.params;
      const { quality } = req.body;

      const learnedWord = user.learnedWords.find(w => w.wordId.toString() === wordId);
      if (!learnedWord) {
        res.status(404).json({
          success: false,
          message: 'Word not found in learned words'
        });
        return;
      }

      const result = reviewWord({
        interval: learnedWord.interval ?? 0,
        repetitions: learnedWord.repetitions ?? 0,
        easeFactor: learnedWord.easeFactor ?? 2.5
      }, quality);

      learnedWord.interval = result.interval;
      learnedWord.repetitions = result.repetitions;
      learnedWord.easeFactor = result.easeFactor;
      learnedWord.nextReviewDate = result.nextReviewDate;
      learnedWord.lastReviewedAt = result.lastReviewedAt;
      learnedWord.stage = result.stage;

      if (quality >= 3) {
        user.points += 1;
      }

      const todayDateOnly = stripTime(new Date());
      if (!user.lastStreakDate) {
        user.streakCount = 1;
      } else {
        const diffDays = Math.round((todayDateOnly.getTime() - stripTime(user.lastStreakDate).getTime()) / 86400000);
        if (diffDays === 1) {
          user.streakCount += 1;
        } else if (diffDays > 1) {
          user.streakCount = 1;
        }
        // diffDays <= 0 (user already reviewed today) does not change streakCount
      }
      user.lastStreakDate = todayDateOnly;

      const learnedWordId = (learnedWord as any)._id;

      await user.save();
      await user.populate('learnedWords.wordId');

      const updatedLearnedWord = (user.learnedWords as any).id(learnedWordId);

      res.status(200).json({
        success: true,
        message: 'Review recorded',
        learnedWord: updatedLearnedWord,
        points: user.points,
        streakCount: user.streakCount,
        lastStreakDate: user.lastStreakDate
      });
    } catch (error) {
      console.error('Review learned word error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error recording review'
      });
    }
  }
);

export default router;