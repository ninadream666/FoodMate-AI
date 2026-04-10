@echo off
chcp 65001 >nul
echo ============================================================
echo        FoodMate-AI 测试运行器
echo        %date% %time%
echo ============================================================
echo.

if "%1"=="install" goto install
if "%1"=="python" goto python
if "%1"=="frontend" goto frontend
if "%1"=="java" goto java
if "%1"=="deploy" goto deploy
if "%1"=="" goto all
echo 用法: run_tests.bat [install^|python^|frontend^|java^|deploy]
echo   install  — 安装 Python 测试依赖
echo   python   — 仅运行 Python 单元测试
echo   frontend — 仅运行前端单元测试
echo   java     — 仅运行 Java 单元测试
echo   deploy   — 运行云端部署测试（34 用例）
echo   (空)     — 运行全部本地测试
goto end

:install
echo ============================================================
echo  [0] 安装 Python 测试依赖
echo ============================================================
pip install -r %~dp0requirements.txt
if %errorlevel%==0 (echo [PASS] 依赖安装成功) else (echo [FAIL] 依赖安装失败)
echo.
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

:deploy
echo ============================================================
echo  [4] 云端部署测试 (pytest → 8.217.223.120)
echo ============================================================
cd /d %~dp0deployment
python -m pytest test_01_functional.py test_02_security.py test_03_performance.py -v -s --tb=short
if %errorlevel%==0 (echo [PASS] 云端部署测试全部通过) else (echo [FAIL] 云端部署测试有失败)
echo.

:end
echo ============================================================
echo  测试运行完成
echo ============================================================
