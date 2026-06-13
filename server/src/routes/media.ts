import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Media from '../models/Media';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import guardianService from '../api/guardianAPI';
import youtubeService from '../api/youtubeAPI';
import { CATEGORIES, CEFRLevel } from '../constants/categories';
import { classifyTextWithOpenAI } from '../services/cefrClassificationService';
import { formatTranscriptWithOpenAI } from '../services/transcriptFormattingService';
import { stripHtml, decodeHtmlEntities } from '../utils/text';

const router = express.Router();

const mapMediaForClient = (mediaDoc: any): any => {
  const contentObj: any = {};
  if (mediaDoc.content && (mediaDoc.content.content || mediaDoc.content.videoUrl || mediaDoc.content.transcript)) {
    if (mediaDoc.content.content) contentObj.content = mediaDoc.content.content;
    if (mediaDoc.content.videoUrl) contentObj.videoUrl = mediaDoc.content.videoUrl;
    if (mediaDoc.content.transcript) contentObj.transcript = stripHtml(mediaDoc.content.transcript);
  }

  return {
    _id: mediaDoc._id,
    title: decodeHtmlEntities(mediaDoc.title),
    type: mediaDoc.type,
    url: mediaDoc.url,
    source: mediaDoc.source,
    description: stripHtml(mediaDoc.description),
    imageUrl: mediaDoc.thumbnailUrl || undefined,
    thumbnailUrl: mediaDoc.thumbnailUrl || undefined,
    cefrLevel: mediaDoc.cefrLevel,
    categories: mediaDoc.categories || [],
    duration: mediaDoc.duration,
    createdAt: mediaDoc.createdAt,
    content: Object.keys(contentObj).length ? contentObj : undefined,
    vocabularyWords: mediaDoc.vocabularyWords || []
  };
};

// @route   GET /api/media/recommendations
// @desc    Get personalized media recommendations
// @access  Private
router.get('/recommendations', 
  authenticate,
  [
    query('type').optional().isIn(['article', 'video']).withMessage('Type must be article or video'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

      const type = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const completedIds = user.completedMedia.map(m => m.mediaId);

      const query: any = {
        cefrLevel: user.cefrLevel,
        _id: { $nin: completedIds }
      };

      if (type) {
        query.type = type;
      }

      if (user.fieldsOfInterest && user.fieldsOfInterest.length > 0) {
        query.categories = { $in: user.fieldsOfInterest };
      }

      const recommendations = await Media.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-vocabularyWords');

      res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations: recommendations.map(mapMediaForClient)
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error getting recommendations'
      });
    }
  }
);

// @route   GET /api/media/guardian/fetch
// @desc    Fetch fresh articles from Guardian API
// @access  Private
router.get('/guardian/fetch',
  authenticate,
  [
    query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

      const category = req.query.category as string | undefined;
      const limit = parseInt(req.query.limit as string) || 10;

      const articles = await guardianService.fetchArticles({
        category,
        pageSize: limit,
        orderBy: 'newest'
      });

      const fetchedUrls = articles.map(a => a.url).filter(Boolean);
      const existing = await Media.find({ url: { $in: fetchedUrls } }).select('url');
      const existingUrls = new Set(existing.map(e => e.url));

      const newArticles = articles.filter(a => a.url && !existingUrls.has(a.url));

      const minContentLength = parseInt('1200', 10);
      const savedArticles: any[] = [];
      for (const article of newArticles) {
        try {
          const rawBody = article.content || '';
          const plainBody = stripHtml(rawBody);
          if (plainBody.length < minContentLength) {
            continue;
          }

          // classifying before saving so the client never sees a stale UNCLASSIFIED card
          let cefrLevel: CEFRLevel = 'UNCLASSIFIED';
          try {
            const result = await classifyTextWithOpenAI(plainBody);
            cefrLevel = result.level;
          } catch (err) {
            console.error('Error classifying article:', err);
          }

          const doc = await Media.create({
            title: article.title,
            type: 'article',
            url: article.url,
            thumbnailUrl: article.thumbnailUrl,
            source: article.source || 'The Guardian',
            description: article.description,
            content: { content: article.content },
            cefrLevel,
            categories: article.categories || []
          });

          savedArticles.push(mapMediaForClient(doc.toObject()));
        } catch (err) {
          console.error('Error saving Guardian article to DB:', err);
        }
      }

      res.status(200).json({
        success: true,
        count: savedArticles.length,
        articles: savedArticles,
        message: 'New articles fetched from Guardian API and saved to database'
      });
    } catch (error) {
      console.error('Guardian fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching articles from Guardian API'
      });
    }
  }
);

// @route   GET /api/media/youtube/fetch
// @desc    Fetch fresh videos from YouTube
// @access  Private
router.get('/youtube/fetch',
  authenticate,
  [
    query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

      const category = req.query.category as string | undefined;
      const limit = parseInt(req.query.limit as string) || 10;

      const user = req.user;
      const videos = category
        ? await youtubeService.searchVideos(category, limit)
        : await youtubeService.getRecommendedVideos(user?.fieldsOfInterest || [], limit);

      const fetchedUrls = videos.map(v => v.url).filter(Boolean);
      const existing = await Media.find({ url: { $in: fetchedUrls } }).select('url');
      const existingUrls = new Set(existing.map(e => e.url));

      const newVideos = videos.filter(v => v.url && !existingUrls.has(v.url));

      // processing videos concurrently - each one needs a transcript fetch plus
      // two OpenAI calls (formatting + classification), which is slow done sequentially
      const savedVideoResults = await Promise.all(newVideos.map(async (video) => {
        try {
          const videoId = video.url.split('v=')[1];
          let transcript = videoId ? await youtubeService.fetchTranscriptText(videoId) : undefined;

          // auto-generated captions have no punctuation/paragraphs, so reformat for readability
          // and so sentence-based features (e.g. "example in text") work correctly
          if (transcript) {
            try {
              transcript = await formatTranscriptWithOpenAI(transcript);
            } catch (err) {
              console.error('Error formatting transcript:', err);
            }
          }

          // classifying before saving so the client never sees a stale UNCLASSIFIED card
          let cefrLevel: CEFRLevel = 'UNCLASSIFIED';
          try {
            const textToClassify = transcript || video.description || video.title;
            const result = await classifyTextWithOpenAI(textToClassify);
            cefrLevel = result.level;
          } catch (err) {
            console.error('Error classifying video:', err);
          }

          const doc = await Media.create({
            title: video.title,
            type: 'video',
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            source: video.source || 'YouTube',
            description: video.description,
            duration: video.duration,
            content: { videoUrl: video.url, transcript },
            cefrLevel,
            categories: video.categories
          });

          return mapMediaForClient(doc.toObject());
        } catch (err) {
          console.error('Error saving YouTube video to DB:', err);
          return null;
        }
      }));

      const savedVideos = savedVideoResults.filter((v): v is NonNullable<typeof v> => v !== null);

      res.status(200).json({
        success: true,
        count: savedVideos.length,
        videos: savedVideos,
        message: 'New videos fetched from YouTube API and saved to database'
      });
    } catch (error) {
      console.error('YouTube fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching videos from YouTube API'
      });
    }
  }
);

// @route   GET /api/media/feed
// @desc    Get feed items (articles/videos) for user's CEFR level
// @access  Private
router.get('/feed',
  authenticate,
  [
    query('type').optional().isIn(['article', 'video']).withMessage('Type must be article or video'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

      const type = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string) || 12;

      const query: any = {
        cefrLevel: user.cefrLevel
      };

      if (type) {
        query.type = type;
      }

      if (user.fieldsOfInterest && user.fieldsOfInterest.length > 0) {
        query.categories = { $in: user.fieldsOfInterest };
      }

      const feedItems = await Media.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-vocabularyWords');

      res.status(200).json({
        success: true,
        count: feedItems.length,
        items: feedItems.map(mapMediaForClient)
      });
    } catch (error) {
      console.error('Get feed error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error getting feed'
      });
    }
  }
);

// @route   GET /api/media/:id
// @desc    Get detailed media content by ID
// @access  Private
router.get('/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const media = await Media.findById(req.params.id)
        .populate('vocabularyWords');

      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found'
        });
        return;
      }

      const mapped = mapMediaForClient(media.toObject());
      mapped.vocabulary = (media as any).vocabularyWords || [];

      res.status(200).json({
        success: true,
        media: mapped
      });
    } catch (error) {
      console.error('Get media error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error getting media'
      });
    }
  }
);

// @route   GET /api/media/search
// @desc    Search media by title, description, or category
// @access  Private
router.get('/search',
  authenticate,
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('type').optional().isIn(['article', 'video']).withMessage('Type must be article or video')
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

      const searchQuery = req.query.q as string;
      const type = req.query.type as string | undefined;

      const query: any = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { categories: { $in: [new RegExp(searchQuery, 'i')] } }
        ]
      };

      if (type) {
        query.type = type;
      }

      const results = await Media.find(query)
        .limit(20)
        .select('-vocabularyWords');

      res.status(200).json({
        success: true,
        count: results.length,
        results
      });
    } catch (error) {
      console.error('Search media error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error searching media'
      });
    }
  }
);

// @route   GET /api/media/category/:category
// @desc    Get media by category
// @access  Private
router.get('/category/:category',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { category } = req.params;
      
      const validCategories: readonly string[] = CATEGORIES;
      if (!validCategories.includes(category)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category',
          validCategories: CATEGORIES
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

      const media = await Media.find({
        categories: category,
        cefrLevel: user.cefrLevel
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('-vocabularyWords');

      res.status(200).json({
        success: true,
        count: media.length,
        category,
        media
      });
    } catch (error) {
      console.error('Get media by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error getting media by category'
      });
    }
  }
);

// @route   POST /api/media/videos/add-with-transcript
// @desc    Add a video with transcript and classify it
// @access  Private
router.post('/videos/add-with-transcript', [
  authenticate,
  body('title').notEmpty().withMessage('Title is required'),
  body('url').notEmpty().withMessage('URL is required'),
  body('transcript').optional().isString().withMessage('Transcript must be a string'),
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

    const { title, url, source, description, thumbnail, transcript, categories } = req.body;

    // classifying before saving so the client never sees a stale UNCLASSIFIED card
    let cefrLevel: CEFRLevel = 'UNCLASSIFIED';
    if (transcript && transcript.trim().length > 0) {
      try {
        const result = await classifyTextWithOpenAI(transcript);
        cefrLevel = result.level;
      } catch (err) {
        console.error('Error classifying video:', err);
      }
    }

    // video with transcript
    const doc = await Media.create({
      title,
      type: 'video',
      url,
      source: source || 'YouTube',
      description,
      thumbnailUrl: thumbnail,
      content: {
        transcript: transcript || '',
        videoUrl: url
      },
      cefrLevel,
      categories: categories || []
    });

    res.status(201).json({
      success: true,
      message: 'Video added successfully' + (transcript ? ' and classified' : ''),
      media: mapMediaForClient(doc.toObject())
    });
  } catch (error) {
    console.error('Add video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding video'
    });
  }
});

export default router;