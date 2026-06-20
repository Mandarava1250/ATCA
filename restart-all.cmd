@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 重启所有服务脚本
:: ============================================

set "NGINX_DIR=C:\nginx"
set "PROJECT_ROOT=%~dp0"

echo.
echo ============================================
echo   ATCA 重启所有服务
echo ============================================
echo.

:: ============================================
:: 停止所有服务
:: ============================================
echo [步骤 1/2] 停止所有服务...

:: 停止 nginx
if exist "%NGINX_DIR%\nginx.exe" (
    cd /d "%NGINX_DIR%"
    nginx -s stop >nul 2>&1
)
taskkill /F /IM nginx.exe >nul 2>&1

:: 停止后端
wmic process where "name='node.exe' and commandline like '%%dist%%main.js%%'" call terminate >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo   [OK] 所有服务已停止
timeout /t 2 /nobreak >nul

:: ============================================
:: 启动所有服务
:: ============================================
echo.
echo [步骤 2/2] 启动所有服务...

:: 启动后端
cd /d "%PROJECT_ROOT%backend"
set "NODE_ENV=production"
start /B cmd /c "title ATCA Backend Server && node dist/main.js"

timeout /t 3 /nobreak >nul

:: 启动 nginx
cd /d "%NGINX_DIR%"
start /B cmd /c "title ATCA Nginx Server && nginx"

timeout /t 2 /nobreak >nul

:: ============================================
:: 完成
:: ============================================
echo.
echo ============================================
echo   重启完成！
echo ============================================
echo.
echo   服务状态:
echo   - 后端 API:  http://127.0.0.1:3000/api/v1
echo   - 前端页面:  http://localhost
echo.

endlocal
exit /b 0
