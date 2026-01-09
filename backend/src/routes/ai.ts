/**
 * AI Routes
 * נקודות קצה נפרדות ל-AI (אלטרנטיבה למסלולים שב-meetings)
 */

import { Router, Request, Response } from 'express';
import { processMeetingSummary, translateMeeting, enrichMeetingContent, testGeminiConnection } from '../services/gemini';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const router = Router();

// AI rate limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many AI requests, please try again in a minute',
});

// POST /api/ai/process - עיבוד טקסט כללי
router.post(
  '/process',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const processed = await processMeetingSummary(content);

    res.json({
      success: true,
      data: { processed },
    });
  })
);

// POST /api/ai/translate - תרגום טקסט כללי
router.post(
  '/translate',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { content, language = 'en' } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const translated = await translateMeeting(content, language);

    res.json({
      success: true,
      data: { translated, language },
    });
  })
);

// POST /api/ai/enrich - העשרת טקסט כללי
router.post(
  '/enrich',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const enriched = await enrichMeetingContent(content);

    res.json({
      success: true,
      data: { enriched },
    });
  })
);

// GET /api/ai/test - בדיקת חיבור
router.get(
  '/test',
  asyncHandler(async (req: Request, res: Response) => {
    const isConnected = await testGeminiConnection();

    res.json({
      success: isConnected,
      message: isConnected ? 'Gemini API is working' : 'Gemini API connection failed',
    });
  })
);

export default router;
