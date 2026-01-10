# Backend - Meeting Summary Pro

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

Server will run on `http://localhost:5000`

### Environment Variables

See `.env.example` for all required variables.

Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key

### Build

```bash
npm run build
```

Compiled files will be in `dist/` directory.

### Production

```bash
npm start
```

## 📁 Project Structure

```
src/
├── config/         # Configuration (Supabase, Gemini)
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
└── server.ts       # Main server file
```

## 🔌 API Endpoints

- `GET /health` - Health check
- `GET /` - API info
- `/api/meetings` - Meetings CRUD + AI processing
- `/api/clients` - Clients management
- `/api/projects` - Projects management
- `/api/ai` - AI services (summarize, translate)

## 🚀 Deploy to Vercel

See `../VERCEL_DEPLOYMENT.md` for full instructions.

Quick:
```bash
vercel
# Set environment variables in Vercel Dashboard
vercel --prod
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run vercel-build` - Build for Vercel deployment

## 🔧 Tech Stack

- Node.js + Express
- TypeScript
- Supabase (PostgreSQL)
- Google Gemini AI
- Rate limiting + Security middleware

---

**Version**: 1.0.0  
**Node**: >=18.0.0
