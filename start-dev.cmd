@echo off
echo 正在启动华夏营造开发服务器...
echo.

:: 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查是否安装了依赖
if not exist "node_modules" (
    echo 正在安装根目录依赖...
    npm install
)

if not exist "frontend\node_modules" (
    echo 正在安装前端依赖...
    cd frontend
    npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo 正在安装后端依赖...
    cd backend
    npm install
    cd ..
)

echo.
echo 依赖安装完成，开始启动服务...
echo.

:: 使用 concurrently 启动前后端
npm run dev

pause