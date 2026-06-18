@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 开发环境启动脚本
:: ============================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

:: ============================================
:: 检查 Node.js
:: ============================================
echo.
echo ============================================
echo   ATCA 开发环境启动脚本
echo ============================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do set "NODE_VERSION=%%i"
echo [OK] Node.js !NODE_VERSION!

:: ============================================
:: 检查并安装依赖
:: ============================================
echo.

:: 根目录依赖
if not exist "%PROJECT_ROOT%node_modules" (
    echo [1/3] 安装根目录依赖...
    cd /d "%PROJECT_ROOT%"
    call npm install
) else (
    echo [1/3] 根目录依赖已存在
)

:: 前端依赖
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [2/3] 安装前端依赖...
    cd /d "%FRONTEND_DIR%"
    call npm install
) else (
    echo [2/3] 前端依赖已存在
)

:: 后端依赖
if not exist "%BACKEND_DIR%\node_modules" (
    echo [3/3] 安装后端依赖...
    cd /d "%BACKEND_DIR%"
    call npm install
) else (
    echo [3/3] 后端依赖已存在
)

echo.
echo ============================================
echo   依赖安装完成，启动开发服务...
echo ============================================
echo.

:: 使用 concurrently 启动前后端
cd /d "%PROJECT_ROOT%"
npm run dev

pause
