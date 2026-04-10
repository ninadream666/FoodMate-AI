#!/bin/bash
# FoodMate-AI 云端部署测试 — 一键运行

set -e
cd "$(dirname "$0")"

echo "============================================================"
echo "  FoodMate-AI 云端部署测试"
echo "  目标: http://8.217.223.120"
echo "============================================================"
echo ""

echo "[1/3] 功能验证测试..."
python -m pytest test_01_functional.py -v --tb=short
echo ""

echo "[2/3] 安全测试..."
python -m pytest test_02_security.py -v --tb=short
echo ""

echo "[3/3] 性能测试与数据流量分析..."
python -m pytest test_03_performance.py -v -s --tb=short
echo ""

echo "============================================================"
echo "  全部测试完成"
echo "============================================================"
