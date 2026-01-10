# 🔍 Pre-Deployment Validation Script

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Meeting Summary Pro" -ForegroundColor Cyan
Write-Host "  Pre-Deployment Validation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($nodeVersion -match "v(\d+)") {
    $major = [int]$matches[1]
    if ($major -lt 18) {
        $errors += "Node.js version $nodeVersion is too old. Need v18 or higher."
    } else {
    Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green
    }
} else {
    $errors += "Node.js not found. Please install Node.js v18 or higher."
}

# Check if backend directory exists
Write-Host "`nChecking backend..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "[OK] Backend directory found" -ForegroundColor Green
    
    # Check backend package.json
    if (Test-Path "backend/package.json") {
        Write-Host "[OK] Backend package.json found" -ForegroundColor Green
    } else {
        $errors += "backend/package.json not found"
    }
    
    # Check vercel.json
    if (Test-Path "backend/vercel.json") {
        Write-Host "[OK] Backend vercel.json found" -ForegroundColor Green
    } else {
        $warnings += "backend/vercel.json not found (will be created)"
    }
    
    # Check if node_modules exists
    if (Test-Path "backend/node_modules") {
        Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
    } else {
        $warnings += "Backend dependencies not installed. Run: cd backend; npm install"
    }
} else {
    $errors += "backend directory not found"
}

# Check if frontend directory exists
Write-Host "`nChecking frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Write-Host "[OK] Frontend directory found" -ForegroundColor Green
    
    # Check frontend package.json
    if (Test-Path "frontend/package.json") {
        Write-Host "[OK] Frontend package.json found" -ForegroundColor Green
    } else {
        $errors += "frontend/package.json not found"
    }
    
    # Check if node_modules exists
    if (Test-Path "frontend/node_modules") {
        Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
    } else {
        $warnings += "Frontend dependencies not installed. Run: cd frontend; npm install"
    }
} else {
    $errors += "frontend directory not found"
}

# Check database files
Write-Host "`nChecking database files..." -ForegroundColor Yellow
if (Test-Path "database/schema.sql") {
    Write-Host "[OK] Database schema.sql found" -ForegroundColor Green
} else {
    $warnings += "database/schema.sql not found"
}

if (Test-Path "database/views.sql") {
    Write-Host "[OK] Database views.sql found" -ForegroundColor Green
} else {
    $warnings += "database/views.sql not found"
}

# Check if git is initialized
Write-Host "`nChecking Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "[OK] Git repository initialized" -ForegroundColor Green
    
    # Check if there are uncommitted changes
    $status = git status --porcelain
    if ($status) {
        $warnings += "You have uncommitted changes. Consider committing before deployment."
    } else {
        Write-Host "[OK] No uncommitted changes" -ForegroundColor Green
    }
} else {
    $warnings += "Git not initialized. Run: git init"
}

# Check if Vercel CLI is installed
Write-Host "`nChecking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "[OK] Vercel CLI installed ($vercelVersion)" -ForegroundColor Green
} catch {
    $warnings += "Vercel CLI not installed. Run: npm install -g vercel"
}

# Summary
Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  Validation Summary" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n[OK] Everything looks good! Ready to deploy!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure you have Supabase and Gemini API keys ready" -ForegroundColor White
    Write-Host "2. Run: cd backend; vercel" -ForegroundColor White
    Write-Host "3. Run: cd frontend; vercel" -ForegroundColor White
    Write-Host "`nSee VERCEL_DEPLOYMENT.md for detailed instructions." -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "`n[ERROR] ERRORS (must fix):" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  * $error" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n[WARNING] WARNINGS (recommended to fix):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  * $warning" -ForegroundColor Yellow
        }
    }
    
    if ($errors.Count -eq 0) {
        Write-Host "`n[OK] No critical errors, but please review warnings." -ForegroundColor Green
    } else {
        Write-Host "`n[ERROR] Please fix errors before deploying." -ForegroundColor Red
    }
}

Write-Host ""
