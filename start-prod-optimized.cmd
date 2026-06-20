@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 生产环境启动脚本（优化版）
:: 针对 2核2GiB 服务器
:: ============================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "NGINX_DIR=C:\nginx"
set "LOG_DIR=%PROJECT_ROOT%logs"
set "BACKEND_LOG=%LOG_DIR%\backend.log"

:: Node.js 内存限制（2GiB的50% = 1GiB）
set "NODE_OPTIONS=--max-old-space-size=1024 --max-semi-space-size=64"

set "BACKEND_PORT=3000"
set "NGINX_PORT=80"

:: 创建日志目录
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

title ATCA 生产环境部署（优化版）
echo.
echo ============================================
echo   ATCA 生产环境部署（2核2GiB优化版）
echo ============================================
echo.

:: ============================================
:: 步骤1: 检查 Node.js
:: ============================================
echo [步骤 1/8] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 未找到 Node.js
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do set "NODE_VERSION=%%i"
echo   [OK] Node.js !NODE_VERSION!

:: ============================================
:: 步骤2: 检查 npm
:: ============================================
echo.
echo [步骤 2/8] 检查 npm 环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 未找到 npm
    pause
    exit /b 1
)
echo   [OK] npm 已安装

:: ============================================
:: 步骤3: 安装依赖
:: ============================================
echo.
echo [步骤 3/8] 安装项目依赖...

if not exist "%BACKEND_DIR%\node_modules" (
    echo   正在安装后端依赖...
    cd /d "%BACKEND_DIR%"
    call npm install
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo   正在安装前端依赖...
    cd /d "%FRONTEND_DIR%"
    call npm install
)
echo   [OK] 依赖安装完成

:: ============================================
:: 步骤4: 端口检测
:: ============================================
echo.
echo [步骤 4/8] 检测端口占用...

netstat -ano | findstr :%BACKEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo   [警告] 端口 %BACKEND_PORT% 已被占用
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%BACKEND_PORT%') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

netstat -ano | findstr :%NGINX_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo   [警告] 端口 %NGINX_PORT% 已被占用
    taskkill /F /IM nginx.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo   [OK] 端口检测完成

:: ============================================
:: 步骤5: 构建项目
:: ============================================
echo.
echo [步骤 5/8] 构建项目...

cd /d "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo   [错误] 前端构建失败
    pause
    exit /b 1
)
echo   [OK] 前端构建完成

cd /d "%BACKEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo   [错误] 后端构建失败
    pause
    exit /b 1
)
echo   [OK] 后端构建完成

:: ============================================
:: 步骤6: 检查 nginx
:: ============================================
echo.
echo [步骤 6/8] 检查 nginx...

if not exist "%NGINX_DIR%\nginx.exe" (
    echo   [错误] 未找到 nginx
    pause
    exit /b 1
)
echo   [OK] nginx 已找到

:: 复制 nginx 配置
copy /Y "%FRONTEND_DIR%\nginx.conf" "%NGINX_DIR%\conf\nginx.conf" >nul
echo   [OK] nginx 配置已更新

:: ============================================
:: 步骤7: 启动后端服务（内存限制）
:: ============================================
echo.
echo [步骤 7/8] 启动后端服务...
echo   内存限制: 1024MB (Node.js --max-old-space-size=1024)

cd /d "%BACKEND_DIR%"
set "NODE_ENV=production"

:: 使用内存限制启动后端
start /B cmd /c "title ATCA Backend Server && set NODE_OPTIONS=%NODE_OPTIONS% && node dist/main.js >> \"%BACKEND_LOG%\" 2>&1"

timeout /t 3 /nobreak >nul

netstat -ano | findstr :%BACKEND_PORT% >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 后端服务启动失败
    pause
    exit /b 1
)
echo   [OK] 后端服务已启动 (端口 %BACKEND_PORT%)

:: ============================================
:: 步骤8: 启动 nginx
:: ============================================
echo.
echo [步骤 8/8] 启动 nginx...

cd /d "%NGINX_DIR%"
nginx -s stop >nul 2>&1
timeout /t 1 /nobreak >nul

start /B cmd /c "title ATCA Nginx Server && nginx"

timeout /t 2 /nobreak >nul

netstat -ano | findstr :%NGINX_PORT% | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] nginx 启动失败
    pause
    exit /b 1
)
echo   [OK] nginx 已启动 (端口 %NGINX_PORT%)

:: ============================================
:: 部署完成
:: ============================================
echo.
echo ============================================
echo   部署完成！
echo ============================================
echo.
echo   服务状态:
echo   - 后端 API:  http://127.0.0.1:%BACKEND_PORT%/api/v1
echo   - 后端健康:  http://127.0.0.1:%BACKEND_PORT%/health
echo   - 性能监控:  http://127.0.0.1:%BACKEND_PORT%/api/monitor/performance
echo   - 前端页面:  http://localhost
echo.
echo   内存限制配置:
echo   - Node.js 最大堆内存: 1024MB
echo   - 半空间大小: 64MB
echo.
echo   日志文件:
echo   - 后端日志: %BACKEND_LOG%
echo.

endlocal
pause
exit /b 0