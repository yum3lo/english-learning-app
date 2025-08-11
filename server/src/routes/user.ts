import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        cefrLevel: user.cefrLevel,
        fieldsOfInterest: user.fieldsOfInterest,
        aiDataConsent: user.aiDataConsent,
        points: user.points,
        wordsLearned: user.wordsLearned,
        articlesRead: user.articlesRead,
        videosWatched: user.videosWatched,
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
        dateOfBirth: user.dateOfBirth,
        cefrLevel: user.cefrLevel,
        fieldsOfInterest: user.fieldsOfInterest,
        aiDataConsent: user.aiDataConsent,
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
    .withMessage('Media type must be either article or video')
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

    const { mediaType } = req.body;

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

export default router;