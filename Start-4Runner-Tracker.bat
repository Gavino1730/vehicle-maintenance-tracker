@echo off
title 4Runner Maintenance Tracker

cd /d "%~dp0"

echo.
echo ======================================
echo   4Runner Maintenance Tracker
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/2] Starting backend server...
echo.

REM Start backend in new window
start "4Runner Backend" cmd /k "cd backend && npm start"

echo [2/2] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3001

echo.
echo ======================================
echo Server is running!
echo.
echo Close the "4Runner Backend" window to stop the server
echo ======================================
echo.

pause
