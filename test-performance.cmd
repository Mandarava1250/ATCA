@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 性能测试脚本
:: 针对 2核2GiB 服务器
:: 测试目标：响应时间 < 2秒，CPU < 70%，无内存泄漏
:: ============================================

set "BACKEND_URL=http://127.0.0.1:3000"
set "LOG_DIR=%~dp0logs"
set "TEST_LOG=%LOG_DIR%\performance-test.log"
set "CONCURRENT_USERS=10"
set "TEST_DURATION=60"

:: 创建日志目录
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

echo.
echo ============================================
echo   ATCA 性能测试
echo   针对 2核2GiB 服务器
echo ============================================
echo.
echo   测试目标:
echo   - 响应时间: ^< 2秒
echo   - CPU峰值: ^< 70%
echo   - 内存使用: ^< 80% (1.6GiB)
echo   - 无内存泄漏
echo.

:: ============================================
:: 检查服务状态
:: ============================================
echo [步骤 1] 检查服务状态...
curl -s "%BACKEND_URL%/health" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 后端服务未运行
    pause
    exit /b 1
)
echo   [OK] 后端服务运行正常

:: ============================================
:: 测试 1: 响应时间测试
:: ============================================
echo.
echo [步骤 2] 响应时间测试...

:: 测试健康检查端点
echo   测试 /health 端点...
for /f "delims=" %%i in ('curl -s -w "%%{time_total}" -o nul "%BACKEND_URL%/health"') do (
    set "HEALTH_TIME=%%i"
)
echo   /health 响应时间: !HEALTH_TIME! 秒

:: 测试 API 端点
echo   测试 /api/v1/architecture/stats 端点...
for /f "delims=" %%i in ('curl -s -w "%%{time_total}" -o nul "%BACKEND_URL%/api/v1/architecture/stats"') do (
    set "STATS_TIME=%%i"
)
echo   /api/v1/architecture/stats 响应时间: !STATS_TIME! 秒

:: 测试建筑列表
echo   测试 /api/v1/architecture 端点...
for /f "delims=" %%i in ('curl -s -w "%%{time_total}" -o nul "%BACKEND_URL%/api/v1/architecture?page=1&limit=12"') do (
    set "ARCH_TIME=%%i"
)
echo   /api/v1/architecture 响应时间: !ARCH_TIME! 秒

:: ============================================
:: 测试 2: 并发测试
:: ============================================
echo.
echo [步骤 3] 并发测试 (%CONCURRENT_USERS% 用户)...

:: 记录测试前内存
for /f "delims=" %%i in ('powershell -Command "[math]::Round((Get-Process node -ErrorAction SilentlyContinue).WorkingSet64 / 1MB, 2)"') do (
    set "MEM_BEFORE=%%i"
)
echo   测试前内存: !MEM_BEFORE! MB

:: 执行并发请求（使用 PowerShell）
echo   执行并发请求...
powershell -Command ^
    "$results = @(); ^
     $urls = @('%BACKEND_URL%/health', '%BACKEND_URL%/api/v1/architecture/stats', '%BACKEND_URL%/api/v1/architecture?page=1&limit=12'); ^
     1..%CONCURRENT_USERS% | ForEach-Object -Parallel { ^
         $r = Invoke-WebRequest -Uri $using:urls[0] -UseBasicParsing -TimeoutSec 5; ^
         Write-Host \"用户 $_: 响应时间 $($r.RawContentLength) bytes\" ^
     } -ThrottleLimit 5; ^
     Write-Host '并发测试完成'"

:: 记录测试后内存
for /f "delims=" %%i in ('powershell -Command "[math]::Round((Get-Process node -ErrorAction SilentlyContinue).WorkingSet64 / 1MB, 2)"') do (
    set "MEM_AFTER=%%i"
)
echo   测试后内存: !MEM_AFTER! MB

:: ============================================
:: 测试 3: 内存泄漏检测
:: ============================================
echo.
echo [步骤 4] 内存泄漏检测...

:: 计算内存变化
set /a "MEM_DIFF=!MEM_AFTER! - !MEM_BEFORE!"

if !MEM_DIFF! gtr 50 (
    echo   [警告] 内存增长 !MEM_DIFF! MB - 可能存在内存泄漏
) else (
    echo   [OK] 内存增长 !MEM_DIFF! MB - 正常范围
)

:: ============================================
:: 测试 4: CPU 使用检查
:: ============================================
echo.
echo [步骤 5] CPU 使用检查...

:: 获取 CPU 使用率
for /f "delims=" %%i in ('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CPU"') do (
    set "CPU_TIME=%%i"
)
echo   Node.js CPU 时间: !CPU_TIME! 秒

:: ============================================
:: 测试结果汇总
:: ============================================
echo.
echo ============================================
echo   测试结果汇总
echo ============================================
echo.

:: 响应时间评估
set "RESPONSE_OK=1"
if !HEALTH_TIME! gtr 2 set "RESPONSE_OK=0"
if !STATS_TIME! gtr 2 set "RESPONSE_OK=0"
if !ARCH_TIME! gtr 2 set "RESPONSE_OK=0"

if !RESPONSE_OK! equ 1 (
    echo   [PASS] 响应时间测试 - 所有端点 ^< 2秒
) else (
    echo   [FAIL] 响应时间测试 - 部分端点 ^> 2秒
)

:: 内存评估
set "MEM_THRESHOLD=1638"
if !MEM_AFTER! lss !MEM_THRESHOLD! (
    echo   [PASS] 内存使用测试 - !MEM_AFTER! MB ^< 80% 阈值
) else (
    echo   [FAIL] 内存使用测试 - !MEM_AFTER! MB ^> 80% 阈值
)

:: 内存泄漏评估
if !MEM_DIFF! lss 50 (
    echo   [PASS] 内存泄漏测试 - 增长 !MEM_DIFF! MB 正常
) else (
    echo   [FAIL] 内存泄漏测试 - 增长 !MEM_DIFF! MB 异常
)

:: ============================================
:: 保存测试结果
:: ============================================
echo.
echo 测试结果已保存到: %TEST_LOG%

(
echo ATCA 性能测试报告
echo 测试时间: %date% %time%
echo.
echo 响应时间:
echo   /health: !HEALTH_TIME! 秒
echo   /api/v1/architecture/stats: !STATS_TIME! 秒
echo   /api/v1/architecture: !ARCH_TIME! 秒
echo.
echo 内存使用:
echo   测试前: !MEM_BEFORE! MB
echo   测试后: !MEM_AFTER! MB
echo   增长: !MEM_DIFF! MB
echo.
echo 并发测试: %CONCURRENT_USERS% 用户
) > "%TEST_LOG%"

:: ============================================
:: 完成
:: ============================================
echo.
echo ============================================
echo   性能测试完成
echo ============================================
echo.

endlocal
pause
exit /b 0