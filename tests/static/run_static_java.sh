#!/usr/bin/env bash
# 运行 Java 静态扫描 (Checkstyle)
# 在每个 Java 微服务下执行 mvn checkstyle:check
set +e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

JAVA_SERVICES=(
    "user-service"
    "order-service"
    "merchant-service"
    "marketing-service"
    "profile-service"
    "platform-service"
)

OUT="$HERE/result_checkstyle.txt"
> "$OUT"

for svc in "${JAVA_SERVICES[@]}"; do
    DIR="$ROOT/backend/$svc"
    if [ ! -d "$DIR" ]; then
        echo "[SKIP] $svc 目录不存在" | tee -a "$OUT"
        continue
    fi
    echo "=== Checkstyle: $svc ===" | tee -a "$OUT"
    (cd "$DIR" && mvn -q -DskipTests checkstyle:check \
        -Dcheckstyle.config.location="$HERE/checkstyle.xml" \
        -Dcheckstyle.failOnViolation=false \
        2>&1 | tail -50) >> "$OUT"
done
echo "完成: $OUT"
