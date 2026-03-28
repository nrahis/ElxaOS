@echo off
title ElxaOS Dev Server
echo ========================================
echo   ElxaOS Dev Server - http://localhost:8080
echo ========================================
echo.
echo Starting server...
echo Press Ctrl+C to stop.
echo.
start http://localhost:8080
python -m http.server 8080
