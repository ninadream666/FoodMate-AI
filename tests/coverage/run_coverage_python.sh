#!/usr/bin/env bash
# 运行 Python 单元测试并生成覆盖率报告
set +e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

cd "$ROOT"
python -m pytest tests/unit/backend/ \
    --cov-config="$HERE/.coveragerc" \
    --cov=backend/recommendation-service/app \
    --cov=backend/ai-pricing-service/app \
    --cov=backend/nutrivision-service/app \
    --cov-report=term-missing \
    --cov-report=html:tests/coverage/html \
    --cov-report=xml:tests/coverage/coverage.xml \
    > tests/coverage/result_coverage_python.txt 2>&1
EXIT=$?
echo "pytest exit=$EXIT"
tail -40 tests/coverage/result_coverage_python.txt
