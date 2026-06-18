@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 服务状态检查脚本
:: ============================================

set "NGINX_DIR=C:\nginx"
set "BACKEND_PORT=3000"
set "NGINX_PORT=80"

echo.
echo ============================================
echo   ATCA 服务状态检查
echo ============================================
echo.

:: ============================================
:: 检查后端服务
:: ============================================
echo [后端服务]
netstat -ano | findstr :%BACKEND_PORT% | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo   状态:   [运行中]
    echo   端口:   %BACKEND_PORT%
    echo   API:    http://127.0.0.1:%BACKEND_PORT%/api/v1
    echo   健康:   http://127.0.0.1:%BACKEND_PORT%/health
) else (
    echo   状态:   [已停止]
    echo   端口:   %BACKEND_PORT% (未监听)
)

:: ============================================
:: 检查 nginx
:: ============================================
echo.
echo [nginx 服务]
netstat -ano | findstr :%NGINX_PORT% | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo   状态:   [运行中]
    echo   端口:   %NGINX_PORT%
    echo   前端:   http://localhost
) else (
    echo   状态:   [已停止]
    echo   端口:   %NGINX_PORT% (未监听)
)

:: ============================================
:: 检查 nginx 进程
:: ============================================
echo.
echo [nginx 进程]
tasklist /FI "IMAGENAME eq nginx.exe" 2>nul | findstr /i nginx.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   进程:   [运行中]
) else (
    echo   进程:   [未运行]
)

:: ============================================
:: 检查 node 进程
:: ============================================
echo.
echo [Node.js 进程]
wmic process where "name='node.exe' and commandline like '%%dist%%main.js%%'" get ProcessId 2>nul | findstr /r "[0-9]"
if %errorlevel% neq 0 (
    echo   后端进程未运行
)

:: ============================================
:: 完成
:: ============================================
echo.
echo ============================================
echo   检查完成
echo ============================================
echo.

endlocal
exit /b 0
