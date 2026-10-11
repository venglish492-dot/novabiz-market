@echo off
setlocal EnableExtensions
title REALITY SYSTEM - rebuild
cd /d "%~dp0"
echo.
echo   Rebuilding REALITY SYSTEM (use this after updating the app's files).
echo   Your progress is stored in your browser and is NOT touched by this.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js was not found. Install the LTS version from https://nodejs.org
  pause
  exit /b 1
)
echo   Checking dependencies (may use the internet if new packages are needed)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo   [!] Installing dependencies failed. Check your internet connection.
  pause
  exit /b 1
)
call npm run build
if errorlevel 1 (
  echo   [!] The build failed. See the messages above.
  pause
  exit /b 1
)
echo.
echo   Done. Start the app with "Start REALITY SYSTEM.bat".
pause
endlocal
