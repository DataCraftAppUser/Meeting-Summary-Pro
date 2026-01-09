# 🚀 Meeting Summary Pro - Setup Script
# סקריפט עזר להקמת הפרויקט

Write-Host "🚀 Meeting Summary Pro - Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# בדוק Node.js
Write-Host "📦 בודק Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js מותקן: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js לא מותקן!" -ForegroundColor Red
    Write-Host "   הורד מ: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# בדוק npm
Write-Host "📦 בודק npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm מותקן: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm לא מותקן!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# התקן Backend
Write-Host "📦 מתקין תלויות Backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path node_modules) {
    Write-Host "⚠️  node_modules כבר קיים, מדלג..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend תלויות הותקנו בהצלחה!" -ForegroundColor Green
    } else {
        Write-Host "❌ שגיאה בהתקנת Backend תלויות!" -ForegroundColor Red
        exit 1
    }
}
Set-Location ..

Write-Host ""

# התקן Frontend
Write-Host "📦 מתקין תלויות Frontend..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path node_modules) {
    Write-Host "⚠️  node_modules כבר קיים, מדלג..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend תלויות הותקנו בהצלחה!" -ForegroundColor Green
    } else {
        Write-Host "❌ שגיאה בהתקנת Frontend תלויות!" -ForegroundColor Red
        exit 1
    }
}
Set-Location ..

Write-Host ""

# בדוק קבצי .env
Write-Host "📝 בודק קבצי .env..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env לא קיים!" -ForegroundColor Yellow
    Write-Host "   העתק את backend\.env.example ל-backend\.env ועדכן את הערכים" -ForegroundColor Yellow
} else {
    Write-Host "✅ backend\.env קיים" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env לא קיים!" -ForegroundColor Yellow
    Write-Host "   העתק את frontend\.env.example ל-frontend\.env ועדכן את הערכים" -ForegroundColor Yellow
} else {
    Write-Host "✅ frontend\.env קיים" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup הושלם!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 קרא את SETUP_GUIDE.md להוראות מפורטות" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 להפעלת השרתים:" -ForegroundColor Cyan
Write-Host "   Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "   Terminal 2: cd frontend && npm start" -ForegroundColor White
Write-Host ""
