import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { stripTime, DEFAULT_SRS_FIELDS } from '../utils/spacedRepetition';
import { applyWordReview } from '../services/reviewService';
import { checkWordModeAgainstTargets, fallbackCheck, normalize } from '../utils/levenshtein';
import { gradeDefinitionAnswer, GradingResult } from '../services/answerGradingService';

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
        knownWordToDef: false,
        knownDefToWord: false,
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

      applyWordReview(user, learnedWord, quality);

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

// @route   POST /api/users/learned-word/:wordId/check-answer
// @desc    Grade a flashcard answer (word-mode: local typo-tolerant check; definition-mode: LLM
//          semantic grading with a Levenshtein fallback), and advance SRS/points/streak if this
//          is the word's first scored attempt this due cycle
// @access  Private
router.post('/learned-word/:wordId/check-answer',
  authenticate,
  [
    param('wordId').isMongoId().withMessage('A valid wordId is required'),
    body('mode').isIn(['word', 'definition']).withMessage('mode must be "word" or "definition"'),
    body('answer').isString().trim().notEmpty().withMessage('answer is required')
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
      const { mode, answer } = req.body as { mode: 'word' | 'definition'; answer: string };

      await user.populate('learnedWords.wordId');
      const learnedWord = user.learnedWords.find(w => w.wordId._id.toString() === wordId);
      if (!learnedWord) {
        res.status(404).json({
          success: false,
          message: 'Word not found in learned words'
        });
        return;
      }

      let verdict: 'correct' | 'partial' | 'incorrect';
      let semanticMatch: boolean | undefined;
      let keyConceptPresent: boolean | undefined;
      let spellingIssue = false;
      let spellingCorrection: string | null = null;
      let feedback: string | undefined;
      let gradedOffline = false;

      if (mode === 'word') {
        const targets = [learnedWord.lemma, learnedWord.surfaceForm, (learnedWord.wordId as any).word];
        const result = checkWordModeAgainstTargets(answer, targets);
        verdict = result.verdict;
        spellingIssue = result.spellingIssue;
        spellingCorrection = result.spellingCorrection ?? null;
      } else {
        const reference = learnedWord.definition;
        if (normalize(answer) === normalize(reference)) {
          verdict = 'correct';
        } else {
          const target = learnedWord.surfaceForm || (learnedWord.wordId as any).word;
          let graded: GradingResult | undefined;
          try {
            graded = await gradeDefinitionAnswer(target, reference, answer);
          } catch (err: any) {
            // one retry - a single transient timeout/network blip shouldn't drop the user
            // straight to the much harsher whole-sentence Levenshtein fallback
            console.warn('Definition grading failed, retrying once:', err?.message || err);
            try {
              graded = await gradeDefinitionAnswer(target, reference, answer);
            } catch (retryErr: any) {
              console.warn('Definition grading retry failed, falling back to Levenshtein check:', retryErr?.message || retryErr);
            }
          }

          if (graded) {
            verdict = graded.verdict;
            semanticMatch = graded.semanticMatch;
            keyConceptPresent = graded.keyConceptPresent;
            spellingIssue = graded.spellingIssue;
            spellingCorrection = graded.spellingCorrection;
            feedback = graded.feedback;
          } else {
            verdict = fallbackCheck(answer, reference);
            gradedOffline = true;
          }
        }
      }

      const quality = verdict === 'incorrect' ? 2 : verdict === 'partial' ? 3 : 4;

      if (mode === 'definition' && verdict === 'correct') {
        learnedWord.knownWordToDef = true;
      } else if (mode === 'word' && verdict === 'correct') {
        learnedWord.knownDefToWord = true;
      }
      if (quality < 3) {
        // a miss resets mastery of both directions, mirroring the repetitions reset below
        learnedWord.knownWordToDef = false;
        learnedWord.knownDefToWord = false;
      }

      const isDue = stripTime(learnedWord.nextReviewDate) <= stripTime(new Date());
      const scored = isDue;
      if (scored) {
        applyWordReview(user, learnedWord, quality);
      }

      const learnedWordId = (learnedWord as any)._id;
      await user.save();
      const updatedLearnedWord = (user.learnedWords as any).id(learnedWordId);

      res.status(200).json({
        success: true,
        verdict,
        semanticMatch,
        keyConceptPresent,
        spellingIssue,
        spellingCorrection,
        feedback,
        gradedOffline,
        quality,
        scored,
        learnedWord: updatedLearnedWord,
        points: user.points,
        streakCount: user.streakCount,
        lastStreakDate: user.lastStreakDate
      });
    } catch (error) {
      console.error('Check answer error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking answer'
      });
    }
  }
);

export default router;