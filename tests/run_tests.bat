@echo off
chcp 65001 >nul
echo ============================================================
echo        FoodMate-AI 测试运行器
echo        %date% %time%
echo ============================================================
echo.

if "%1"=="python" goto python
if "%1"=="frontend" goto frontend
if "%1"=="java" goto java
if "%1"=="" goto all
echo 用法: run_tests.bat [python^|frontend^|java]
goto end

:all
:python
echo ============================================================
echo  [1/3] Python 单元测试 (pytest)
echo ============================================================
cd /d %~dp0..
python -m pytest tests/unit/backend/ -v --tb=short
if %errorlevel%==0 (echo [PASS] Python 测试全部通过) else (echo [FAIL] Python 测试有失败)
echo.
if "%1"=="python" goto end

:frontend
echo ============================================================
echo  [2/3] 前端单元测试 (Jest)
echo ============================================================
cd /d %~dp0..
npx jest tests/unit/frontend/ --no-cache --config="{}"
if %errorlevel%==0 (echo [PASS] 前端测试全部通过) else (echo [FAIL] 前端测试有失败)
echo.
if "%1"=="frontend" goto end

:java
echo ============================================================
echo  [3/3] Java 单元测试 (Maven + JUnit 5)
echo ============================================================
cd /d %~dp0
mvn test
if %errorlevel%==0 (echo [PASS] Java 测试全部���过) else (echo [FAIL] Java 测试有失败)
echo.

:end
echo ============================================================
echo  测试运行完成
echo ============================================================
