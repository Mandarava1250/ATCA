@echo off
setlocal enabledelayedexpansion

:: ============================================
:: ATCA 性能监控脚本
:: 针对 2核2GiB 服务器
:: ============================================

set "BACKEND_URL=http://127.0.0.1:3000"
set "LOG_DIR=%~dp0logs"
set "MONITOR_LOG=%LOG_DIR%\performance.log"

:: 创建日志目录
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

echo.
echo ============================================
echo   ATCA 性能监控
echo ============================================
echo.

:: ============================================
:: 检查后端服务状态
:: ============================================
echo [1] 检查后端服务状态...
curl -s "%BACKEND_URL%/health" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 后端服务未运行
    echo   请先启动后端服务: start-prod.cmd
    pause
    exit /b 1
)
echo   [OK] 后端服务运行正常

:: ============================================
:: 获取性能数据
:: ============================================
echo.
echo [2] 获取性能数据...

:: 使用 curl 获取性能监控数据
curl -s "%BACKEND_URL%/api/monitor/performance" > "%MONITOR_LOG%.tmp"

if exist "%MONITOR_LOG%.tmp" (
    type "%MONITOR_LOG%.tmp"
    echo.
    
    :: 解析 JSON（简单方式）
    for /f "tokens=2 delims=:" %%a in ('findstr "rss" "%MONITOR_LOG%.tmp"') do (
        set "RSS=%%a"
    )
    
    del "%MONITOR_LOG%.tmp"
) else (
    echo   [警告] 无法获取性能数据
)

:: ============================================
:: 检查内存使用
:: ============================================
echo.
echo [3] 内存使用情况...

:: 使用 PowerShell 获取进程内存
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object Name, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}}, @{Name='CPU(%)';Expression={$_.CPU}} | Format-Table -AutoSize"

powershell -Command "Get-Process nginx -ErrorAction SilentlyContinue | Select-Object Name, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}} | Format-Table -AutoSize"

:: ============================================
:: 检查端口状态
:: ============================================
echo.
echo [4] 端口状态...
netstat -ano | findstr ":3000" | findstr "LISTENING"
netstat -ano | findstr ":80" | findstr "LISTENING"

:: ============================================
:: 内存警告检查
:: ============================================
echo.
echo [5] 内存阈值检查...

:: 总内存使用（使用 PowerShell）
for /f "delims=" %%i in ('powershell -Command "[math]::Round((Get-Process node,nginx -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum / 1MB, 2)"') do (
    set "TOTAL_MEM=%%i"
)

echo   总内存使用: !TOTAL_MEM! MB

:: 2GiB = 2048MB, 80% = 1638MB
set "MEM_THRESHOLD=1638"

:: 检查是否超过阈值
powershell -Command "if (%TOTAL_MEM% gt %MEM_THRESHOLD%) { Write-Host '[警告] 内存使用超过阈值!' } else { Write-Host '[OK] 内存使用正常' }"

:: ============================================
:: 完成
:: ============================================
echo.
echo ============================================
echo   监控完成
echo ============================================
echo.
echo   性能监控端点: %BACKEND_URL%/api/monitor/performance
echo   健康检查端点: %BACKEND_URL%/health
echo.

endlocal
pause
exit /b 0