@echo off
title Tien Len Checkmate 16 & Roguelike Augments
chcp 65001 >nul
echo ===================================================================
echo     🃏 TIẾN LÊN CHECKMATE 16 & ROGUELIKE AUGMENTS
echo ===================================================================
echo.
echo [1] Đang kiểm tra và giải phóng port 3001 (tránh xung đột tiến trình cũ)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo     -> Đang tắt tiến trình cũ PID: %%a...
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 >nul

echo [2] Đang khởi động Backend Socket.io Server (Port 3001)...
cd /d "%~dp0server"
start "Tien Len Backend (Port 3001)" cmd /k "npm run dev"

echo [3] Đang mở game trên trình duyệt...
timeout /t 2 >nul
start http://localhost/tienlen

echo.
echo ===================================================================
echo  ĐÃ KHỞI ĐỘNG XONG!
echo  - Nếu chơi qua WAMP: http://localhost/tienlen
echo  - Cửa sổ Backend màu đen cần giữ mở để Socket.io hoạt động.
echo ===================================================================
echo.
exit
