@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 停止所有服务脚本
:: ============================================

set "NGINX_DIR=C:\nginx"
set "PROJECT_ROOT=%~dp0"

echo.
echo ============================================
echo   ATCA 停止所有服务
echo ============================================
echo.

:: ============================================
:: 停止 nginx
:: ============================================
echo [1/2] 停止 nginx...
if exist "%NGINX_DIR%\nginx.exe" (
    cd /d "%NGINX_DIR%"
    nginx -s stop >nul 2>&1
    echo   [OK] nginx 已停止
) else (
    echo   [跳过] nginx 未安装
)

:: 强制终止 nginx 进程
taskkill /F /IM nginx.exe >nul 2>&1

:: ============================================
:: 停止后端服务
:: ============================================
echo.
echo [2/2] 停止后端服务...
wmic process where "name='node.exe' and commandline like '%%dist%%main.js%%'" call terminate >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo   [OK] 后端服务已停止

:: ============================================
:: 完成
:: ============================================
echo.
echo ============================================
echo   所有服务已停止
echo ============================================
echo.

endlocal
exit /b 0
