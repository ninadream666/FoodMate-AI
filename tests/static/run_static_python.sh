#!/usr/bin/env bash
# 运行 Python 静态扫描（pylint + flake8）
# 输出: tests/static/result_pylint.txt, result_flake8.txt
set +e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

PY_TARGETS=(
    "$ROOT/backend/recommendation-service/app"
    "$ROOT/backend/ai-pricing-service/app"
    "$ROOT/backend/nutrivision-service/app"
)

echo "=== pylint ==="
python -m pylint --rcfile="$HERE/.pylintrc" "${PY_TARGETS[@]}" \
    > "$HERE/result_pylint.txt" 2>&1
PYLINT_EXIT=$?
echo "pylint exit=$PYLINT_EXIT"
tail -5 "$HERE/result_pylint.txt"

echo ""
echo "=== flake8 ==="
python -m flake8 --config="$HERE/.flake8" "${PY_TARGETS[@]}" \
    > "$HERE/result_flake8.txt" 2>&1
FLAKE_EXIT=$?
echo "flake8 exit=$FLAKE_EXIT"
tail -10 "$HERE/result_flake8.txt"
