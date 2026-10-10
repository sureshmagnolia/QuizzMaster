@echo off
title Sahyadri Wildlife Quiz 2026 - Launcher
cd /d "%~dp0"
echo ====================================================================
echo      THE SAHYADRI WILDLIFE QUIZ 2026 - APPLICATION LAUNCHER
echo ====================================================================
echo.
echo Checking for Python runtime...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python detected! Starting local application web server...
    echo Both Quizmaster Control and Public Projection screens will open automatically.
    echo.
    python server.py
) else (
    echo Python not found on system PATH.
    echo Launching screens directly in your default web browser...
    echo.
    start "" "qm_control.html"
    timeout /t 1 /nobreak >nul
    start "" "index.html"
    echo Opened QM Control and Public View.
    pause
)
