/**
 * Meeting Summary Pro - Backend Server
 * Express + TypeScript + Supabase + Gemini AI
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables FIRST
dotenv.config();

// Import Supabase and Gemini after dotenv
import { supabase } from './config/supabase';
import { geminiClient } from './config/gemini';

// Routes
import itemsRouter from './routes/items';
import workspacesRouter from './routes/workspaces';
import topicsRouter from './routes/topics';
import aiRouter from './routes/ai';
import aiPromptsRouter from './routes/ai_prompts';
import authRouter from './routes/auth';
import hubsRouter from './routes/hubs';
import adminRouter from './routes/admin';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// ================================================================
// MIDDLEWARE
// ================================================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://frontend-one-coral-99.vercel.app',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed origins or is a Vercel preview URL
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed.includes(',')) {
          return allowed.split(',').map(o => o.trim()).includes(origin);
        }
        return allowed === origin;
      }) || origin.endsWith('.vercel.app');

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ================================================================
// HEALTH CHECK
// ================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// ================================================================
// API ROUTES
// ================================================================

app.use('/api/auth', authRouter);
app.use('/api/hubs', hubsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/items', itemsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/prompts', aiPromptsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Meeting Summary Pro API',
    version: '1.0.0',
    description: 'Backend API for AI-powered meeting summaries',
    endpoints: {
      health: '/health',
      items: '/api/items',
      workspaces: '/api/workspaces',
      topics: '/api/topics',
      ai: '/api/ai',
      prompts: '/api/prompts',
    },
    docs: 'https://github.com/your-repo/docs',
  });
});

// ================================================================
// ERROR HANDLING
// ================================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ================================================================
// VERIFY CONNECTIONS
// ================================================================

async function verifyConnections() {
  console.log('\n🔍 Verifying connections...\n');

  // Check Supabase
  try {
    const { data, error } = await supabase.from('workspaces').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase');
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('   Please check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  }

  // Check Gemini API
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    // Try a simple generation to verify the key and model
    // Using import from geminiClient instead of direct class to avoid TS issues
    const { geminiClient } = require('./config/gemini');
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    await model.generateContent('test');
    
    console.log('✅ Gemini API ready and verified');
  } catch (error: any) {
    console.error('❌ Gemini API verification failed:', error.message);
    console.error('   Please check GEMINI_API_KEY in .env');
  }

  console.log('');
}

// ================================================================
// START SERVER
// ================================================================

async function startServer() {
  try {
    // Verify connections first
    await verifyConnections();

    // Start server
    const server = app.listen(PORT, () => {
      console.log('🚀 Meeting Summary Pro Backend');
      console.log('================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('================================\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('⚠️  SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
