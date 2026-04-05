#!/bin/bash
# ============================================================
# FoodMate-AI 一键测试运行脚本
# 运行方式: bash tests/run_tests.sh [python|frontend|java|all]
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

passed=0
failed=0

print_header() {
    echo ""
    echo "============================================================"
    echo -e "${YELLOW} $1 ${NC}"
    echo "============================================================"
}

# ==================== Python 测试 ====================
run_python_tests() {
    print_header "Python 单元测试 (pytest)"
    cd "$PROJECT_DIR"
    if command -v python &> /dev/null && python -c "import pytest" 2>/dev/null; then
        python -m pytest tests/unit/backend/recommendation-service/ \
                         tests/unit/backend/ai-pricing-service/ \
                         tests/unit/backend/nutrivision-service/ \
                         -v --tb=short 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Python 测试全部通过${NC}"
            ((passed++))
        else
            echo -e "${RED}✗ Python 测试有失败${NC}"
            ((failed++))
        fi
    else
        echo -e "${YELLOW}⚠ 跳过: 未安装 pytest (pip install pytest)${NC}"
    fi
}

# ==================== 前端测试 ====================
run_frontend_tests() {
    print_header "前端单元测试 (Jest)"
    cd "$PROJECT_DIR"
    if command -v npx &> /dev/null; then
        npx jest tests/unit/frontend/ --no-cache --config='{}' 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 前端测试全部通过${NC}"
            ((passed++))
        else
            echo -e "${RED}✗ 前端测试有失败${NC}"
            ((failed++))
        fi
    else
        echo -e "${YELLOW}⚠ 跳过: 未安装 Node.js/npx${NC}"
    fi
}

# ==================== Java 测试 ====================
run_java_tests() {
    print_header "Java 单元测试 (Maven + JUnit 5)"
    cd "$SCRIPT_DIR"
    if command -v mvn &> /dev/null; then
        mvn test -q 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Java 测试全部通过${NC}"
            ((passed++))
        else
            echo -e "${RED}✗ Java 测试有失败${NC}"
            ((failed++))
        fi
    else
        echo -e "${YELLOW}⚠ 跳过: 未安装 Maven (mvn)${NC}"
    fi
}

# ==================== 主流程 ====================
echo "============================================================"
echo "       FoodMate-AI 测试运行器"
echo "       $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

case "${1:-all}" in
    python)
        run_python_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    java)
        run_java_tests
        ;;
    all)
        run_python_tests
        run_frontend_tests
        run_java_tests
        ;;
    *)
        echo "用法: bash tests/run_tests.sh [python|frontend|java|all]"
        exit 1
        ;;
esac

echo ""
echo "============================================================"
echo -e "  测试完成: ${GREEN}${passed} 组通过${NC}, ${RED}${failed} 组失败${NC}"
echo "============================================================"

exit $failed
