@echo off
title Tien Len Checkmate 16 Cyberpunk Arena
echo ===================================================================
echo     KHOI DONG TIEN LEN CHECKMATE 16 ^& ROGUELIKE AUGMENTS
echo ===================================================================
echo.
echo [1] Hay dam bao bieu tuong WampServer da bat (chuyen sang mau xanh la).
echo [2] Dang khoi dong Backend Server (Socket.io ^& MySQL API tai port 3001)...
echo [3] Ban co the mo game tai:
echo       - WampServer URL:  http://localhost/tienlen
echo       - Local Dev URL:   http://localhost:5173
echo.
echo ===================================================================
start http://localhost/tienlen
npm start
pause
