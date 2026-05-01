#!/usr/bin/env bash
# OWASP ZAP Baseline Scan — 被动扫描（CLI 模式）
# 5-10 分钟完成，用于 CI 集成
#
# 前置：已安装 ZAP，zap.bat 在 PATH，或使用 Docker
# 推荐 Docker：docker pull zaproxy/zap-stable
set +e

HERE="$(cd "$(dirname "$0")" && pwd)"
TARGETS_FILE="$HERE/foodmate_zap_targets.txt"
REPORT_DIR="$HERE/baseline_reports"
mkdir -p "$REPORT_DIR"

# 检测 Docker 可用性
if command -v docker &> /dev/null; then
    echo "=== 使用 Docker 运行 ZAP Baseline Scan ==="
    while IFS= read -r url; do
        # 跳过注释和空行
        [[ -z "$url" || "$url" =~ ^# ]] && continue
        echo "扫描: $url"
        # 提取主机端口作为报告名
        slug=$(echo "$url" | sed 's|http[s]*://||;s|[/:]|_|g')
        docker run --rm --network=host \
            -v "$REPORT_DIR:/zap/wrk:rw" \
            zaproxy/zap-stable \
            zap-baseline.py \
                -t "$url" \
                -r "report_${slug}.html" \
                -J "report_${slug}.json"
    done < "$TARGETS_FILE"
else
    echo "=== 使用本地 ZAP 安装运行 Baseline Scan ==="
    if ! command -v zap.sh &> /dev/null && ! command -v zap.bat &> /dev/null; then
        echo "❌ 未找到 zap.sh / zap.bat，请先安装 OWASP ZAP 或使用 Docker"
        exit 1
    fi
    while IFS= read -r url; do
        [[ -z "$url" || "$url" =~ ^# ]] && continue
        echo "扫描: $url"
        slug=$(echo "$url" | sed 's|http[s]*://||;s|[/:]|_|g')
        zap.sh -cmd \
            -quickurl "$url" \
            -quickout "$REPORT_DIR/report_${slug}.html" \
            -quickprogress
    done < "$TARGETS_FILE"
fi

echo ""
echo "✅ Baseline 扫描完成，报告位于: $REPORT_DIR"
