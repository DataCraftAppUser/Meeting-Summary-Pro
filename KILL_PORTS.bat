@echo off
echo ========================================
echo   Killing processes on ports 5000 and 3000
echo ========================================
echo.

echo Checking port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo   Found PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   Successfully killed PID: %%a
    ) else (
        echo   Failed to kill PID: %%a (may require admin rights)
    )
)

echo.
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   Found PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   Successfully killed PID: %%a
    ) else (
        echo   Failed to kill PID: %%a (may require admin rights)
    )
)

echo.
echo Done!
echo.
pause
