@echo off
setlocal EnableExtensions
title REALITY SYSTEM - build Android APK
cd /d "%~dp0"
echo.
echo   Builds the Android app (APK) on this computer.
echo   Requirements: Node.js, and Android Studio installed once
echo   (it provides Java and the Android SDK). See README, section "Android app".
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js was not found. Install the LTS version from https://nodejs.org
  pause
  exit /b 1
)
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not defined ANDROID_HOME (
  echo   [!] The Android SDK was not found. Install Android Studio from
  echo       https://developer.android.com/studio and open it once so it downloads the SDK.
  pause
  exit /b 1
)
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if not exist "node_modules\" (
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
)
call npm run android:sync
if errorlevel 1 goto :fail
pushd android
call gradlew.bat assembleRelease
if errorlevel 1 (
  popd
  goto :fail
)
popd
copy /y "android\app\build\outputs\apk\release\app-release.apk" "RealitySystem.apk" >nul
echo.
echo   Done: RealitySystem.apk is in this folder. Copy it to your phone and open it to install.
pause
exit /b 0
:fail
echo.
echo   [!] The build failed. See the messages above.
pause
exit /b 1
