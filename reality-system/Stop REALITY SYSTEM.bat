@echo off
setlocal EnableExtensions
title REALITY SYSTEM - stop
echo.
echo   Stopping the REALITY SYSTEM local server (port 4747)...
echo   This only stops the server. Your saved progress is NOT deleted.
echo.
set "FOUND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":4747 .*LISTENING"') do (
  set "FOUND=1"
  taskkill /PID %%p /F >nul 2>nul
)
if defined FOUND (
  echo   Stopped.
) else (
  echo   The server was not running.
)
timeout /t 3 >nul
endlocal
