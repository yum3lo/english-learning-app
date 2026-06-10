import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Media from '../models/Media';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { classifyTextWithOpenAI } from '../services/cefrClassificationService';

const router = express.Router();

// @route   POST /api/cefr/classify-media
// @desc    Classify a single media item (article or video) by ID
// @access  Private
router.post('/classify-media', [
  authenticate,
  body('mediaId').notEmpty().withMessage('mediaId is required'),
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

    const { mediaId } = req.body;
    const media = await Media.findById(mediaId);

    if (!media) {
      res.status(404).json({
        success: false,
        message: 'Media not found'
      });
      return;
    }

    const textToClassify = media.content?.transcript || media.content?.content || media.description || media.title;

    if (!textToClassify) {
      res.status(400).json({
        success: false,
        message: 'No text content available to classify'
      });
      return;
    }

    const result = await classifyTextWithOpenAI(textToClassify);

    // updating media with classification result
    media.cefrLevel = result.level;
    await media.save();

    res.status(200).json({
      success: true,
      message: 'Media classified successfully',
      media: {
        _id: media._id,
        title: media.title,
        cefrLevel: media.cefrLevel,
        classification: result
      }
    });
  } catch (error) {
    console.error('Classify media error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error classifying media'
    });
  }
});

// @route   POST /api/cefr/classify-all
// @desc    Classify all unclassified media items
// @access  Private
router.post('/classify-all', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const unclassifiedMedia = await Media.find({ cefrLevel: 'UNCLASSIFIED' });

    if (unclassifiedMedia.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No unclassified media found',
        classified: 0,
        results: []
      });
      return;
    }

    const results: any[] = [];
    let classified = 0;
    let failed = 0;

    // classifying each item sequentially (to avoid rate limits)
    for (const media of unclassifiedMedia) {
      try {
        const textToClassify = media.content?.transcript || media.content?.content || media.description || media.title;

        if (!textToClassify) {
          results.push({
            mediaId: media._id,
            title: media.title,
            status: 'skipped',
            reason: 'No text content available'
          });
          continue;
        }

        const result = await classifyTextWithOpenAI(textToClassify);
        media.cefrLevel = result.level;
        await media.save();

        results.push({
          mediaId: media._id,
          title: media.title,
          status: 'success',
          cefrLevel: media.cefrLevel,
          classification: result
        });

        classified++;

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        results.push({
          mediaId: media._id,
          title: media.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to classify media ${media._id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Batch classification completed',
      stats: {
        total: unclassifiedMedia.length,
        classified,
        failed,
        skipped: unclassifiedMedia.length - classified - failed
      },
      results
    });
  } catch (error) {
    console.error('Batch classify error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error classifying media'
    });
  }
});

// @route   GET /api/cefr/status
// @desc    Get classification status
// @access  Private
router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const total = await Media.countDocuments();
    const unclassified = await Media.countDocuments({ cefrLevel: 'UNCLASSIFIED' });
    const classified = total - unclassified;

    res.status(200).json({
      success: true,
      stats: {
        total,
        classified,
        unclassified,
        percentageClassified: total > 0 ? Math.round((classified / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classification status'
    });
  }
});

export default router;
