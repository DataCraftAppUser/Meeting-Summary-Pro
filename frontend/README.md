# Frontend - Meeting Summary Pro

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Start development server
npm start
```

App will run on `http://localhost:3000`

### Environment Variables

See `.env.example` for all required variables.

Required:
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anon/public key
- `REACT_APP_API_URL` - Backend API URL

### Build

```bash
npm run build
```

Optimized production build will be in `build/` directory.

## 📁 Project Structure

```
src/
├── components/     # React components
│   ├── Common/     # Reusable components
│   ├── Layout/     # Layout components
│   └── Meetings/   # Meeting-specific components
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
├── theme.ts        # MUI theme configuration
└── App.tsx         # Main app component
```

## 🎨 Features

- ✅ Rich text editor (TipTap)
- ✅ Auto-save functionality
- ✅ AI-powered summarization
- ✅ Translation to English
- ✅ Client & project management
- ✅ Version history
- ✅ Responsive design (mobile-friendly)
- ✅ RTL support (Hebrew)

## 🚀 Deploy to Vercel

See `../VERCEL_DEPLOYMENT.md` for full instructions.

Quick:
```bash
vercel
# Set environment variables in Vercel Dashboard
vercel --prod
```

## 📝 Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 🔧 Tech Stack

- React 18
- TypeScript
- Material-UI (MUI)
- TipTap (Rich text editor)
- TanStack Query (React Query)
- Axios
- React Router
- date-fns

---

**Version**: 1.0.0  
**Node**: >=18.0.0
