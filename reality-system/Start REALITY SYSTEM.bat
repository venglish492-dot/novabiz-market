@echo off
setlocal EnableExtensions
title REALITY SYSTEM
cd /d "%~dp0"

echo.
echo   ==========================================
echo     REALITY SYSTEM  -  local launcher
echo   ==========================================
echo.

rem --- 1. Node.js present? ------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js was not found on this computer.
  echo.
  echo       1. Download the "LTS" version from https://nodejs.org
  echo       2. Install it with the default options.
  echo       3. Double-click this file again.
  echo.
  pause
  exit /b 1
)
set "NODE_MAJOR="
for /f %%v in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%v"
if not defined NODE_MAJOR set "NODE_MAJOR=0"
if %NODE_MAJOR% LSS 20 (
  echo   [!] Your Node.js version is too old. Please install the current LTS from https://nodejs.org
  pause
  exit /b 1
)

rem --- 2. Already running? Just open the browser. -------------------------
netstat -ano | findstr /R /C:":4747 .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo   REALITY SYSTEM is already running. Opening it in your browser...
  start "" "http://localhost:4747/"
  timeout /t 3 >nul
  exit /b 0
)

rem --- 3. First run: install dependencies (internet needed once) ----------
if not exist "node_modules\" (
  echo   First start: installing dependencies. This needs an internet
  echo   connection ONCE and can take a few minutes...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   [!] Installing dependencies failed. Check your internet connection
    echo       and try again. Your saved progress is not affected.
    pause
    exit /b 1
  )
)

rem --- 4. Build the app if needed ------------------------------------------
if not exist "dist\index.html" (
  echo   Building the app...
  call npm run build
  if errorlevel 1 (
    echo.
    echo   [!] The build failed. See the messages above.
    echo       Your saved progress is stored in the browser and is not affected.
    pause
    exit /b 1
  )
)

rem --- 5. Serve it locally and open the browser ----------------------------
echo.
echo   REALITY SYSTEM is starting at  http://localhost:4747/
echo.
echo   Keep this window open while you use the app.
echo   To stop the local server, close this window (or press Ctrl+C).
echo   Stopping the server does NOT delete your progress - it is saved in your browser.
echo.
call npx vite preview --open
if errorlevel 1 (
  echo.
  echo   [!] The local server stopped with an error. If the message above says the
  echo       port 4747 is in use, another program is using it. Close that program
  echo       or run "Stop REALITY SYSTEM.bat", then try again.
  pause
)
endlocal
