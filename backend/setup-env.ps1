# Backend Environment Variables for Vercel Production

vercel env add SUPABASE_URL production <<< "https://rfmpptvrnpzyxqidiomx.supabase.co"
vercel env add SUPABASE_SERVICE_KEY production <<< "sb_secret_XGsT3Bdxb-sOaMHFcQSbZg_2DgMva4s"
vercel env add GEMINI_API_KEY production <<< "AIzaSyBQ6KrvvoObpwllTw1PBVAZDaO4RgnVj90"
vercel env add NODE_ENV production <<< "production"
vercel env add JWT_SECRET production <<< "meeting-summary-pro-jwt-secret-2026"
vercel env add FRONTEND_URL production <<< "https://frontend-placeholder.vercel.app"
vercel env add RATE_LIMIT_WINDOW_MS production <<< "60000"
vercel env add RATE_LIMIT_MAX_REQUESTS production <<< "100"
vercel env add AI_RATE_LIMIT_MAX production <<< "10"

Write-Host "Environment variables configured!" -ForegroundColor Green
Write-Host "Now redeploying backend..." -ForegroundColor Yellow
vercel --prod
