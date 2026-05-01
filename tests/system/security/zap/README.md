# OWASP ZAP 安全扫描指南 — FoodMate-AI

## 测试目标

补充手工 SQL 注入 / XSS 测试（test_input_validation.py 14 用例）的不足，使用 OWASP ZAP 对全部 9 个微服务执行自动化漏洞扫描，覆盖 OWASP Top 10 全部条目。

## 工具简介

OWASP ZAP（Zed Attack Proxy）是 OWASP 旗舰级开源 Web 安全扫描器，提供：
- ✅ **完整 GUI**（Java/Swing，跨平台）
- ✅ Spider 自动爬取站点
- ✅ Active Scan 主动漏洞探测
- ✅ Passive Scan 被动检查
- ✅ Fuzzer / Manual Request Editor / WebSocket 调试
- ✅ HTML/XML/JSON 多种报告格式
- ✅ 命令行模式 / Docker 镜像（zaproxy/zap-stable）

## 文件清单

| 文件 | 说明 |
|------|------|
| `foodmate_zap_targets.txt` | 19 个待扫描 URL 清单 |
| `zap_scan_policy.md` | 扫描策略与风险判定标准 |
| `run_zap_baseline.sh` | CLI 一键运行 Baseline 扫描 |
| `baseline_reports/` | Baseline 扫描报告输出目录 |
| `active_reports/` | Active 扫描报告输出目录 |

## 安装 OWASP ZAP

### 方式 1：本地安装（推荐用于 GUI 调试）

1. 访问 [zaproxy.org/download](https://www.zaproxy.org/download/)
2. Windows 用户下载 `ZAP_2.16.0_windows.exe` 安装包
3. 安装到 `D:\DevTools\OWASP-ZAP\`
4. 启动桌面快捷方式或 `zap.bat`

### 方式 2：Docker（推荐用于 CI）

```bash
docker pull zaproxy/zap-stable
```

## 启动后端服务

ZAP 扫描需要后端微服务全部就绪：

```cmd
cd D:\FoodMate-AI\backend
docker compose -f docker-compose.dev.yml up -d
:: 等待全部 9 个微服务启动（约 60-90 秒）
```

## 运行方式

### 方式 1：GUI 模式（推荐用于课程演示）

1. 启动 ZAP GUI（双击桌面图标）
2. 选择"否，我不想保留这个会话" → OK
3. **快速扫描**：
   - 顶部输入栏键入 URL（如 `http://localhost:8083`）
   - 点击 "Attack" 按钮 → 开始 Spider + Active Scan
4. **完整扫描**：
   - 菜单 **File → Open URL** → 输入目标 URL
   - 右键左侧 Sites 树中的目标节点 → **Attack → Spider** 爬取
   - 右键节点 → **Attack → Active Scan** 主动扫描
5. **查看告警**：左侧 **Alerts 标签页** 实时刷新发现的漏洞
6. **生成报告**：菜单 **Report → Generate HTML/JSON Report**

### 方式 2：CLI Baseline 扫描（推荐用于 CI 集成）

```bash
cd D:/FoodMate-AI/tests/system/security/zap
bash run_zap_baseline.sh
```

输出报告位于 `baseline_reports/report_localhost_8083.html` 等。

### 方式 3：Docker 一次性扫描

```bash
# Baseline（被动，5-10 min）
docker run --rm --network=host \
    -v $(pwd):/zap/wrk:rw \
    zaproxy/zap-stable \
    zap-baseline.py \
        -t http://localhost:8083 \
        -r report_user_baseline.html

# Full Active Scan（主动，30-90 min）
docker run --rm --network=host \
    -v $(pwd):/zap/wrk:rw \
    zaproxy/zap-stable \
    zap-full-scan.py \
        -t http://localhost:8083 \
        -r report_user_full.html
```

## 扫描策略

参见 `zap_scan_policy.md`，分两轮：
- **Baseline Scan**：5-10 分钟，被动检查，HTTP 头/Cookie/信息泄露/TLS
- **Full Active Scan**：30-90 分钟，主动攻击载荷，覆盖 OWASP Top 10

## 与手工注入测试的关系

| 测试 | 用例数 | 触发方式 | 适用场景 |
|------|--------|---------|---------|
| `test_input_validation.py` | 14 | pytest 自动 | 每次 PR 回归 |
| ZAP Baseline | 19 个 URL | CLI / Docker | 每周扫描 |
| ZAP Full Active Scan | 9 个微服务 | GUI / CLI | 每月深度扫描 |

三者并行不冲突。

## 中文界面

ZAP 默认英文，切换中文：**Tools → Options → Display → Language → 中文(简体)** → 重启。

## 预期结果与目标

| 指标 | 目标值 |
|------|--------|
| High 风险漏洞 | 0 |
| Medium 风险漏洞 | ≤ 3（仅限非关键服务）|
| Low 风险漏洞 | ≤ 10（多为缺失安全 HTTP 头） |
| 已知 CVE 组件 | 0 严重等级 |

如发现 High 风险漏洞，按 `zap_scan_policy.md` 当日修复。

## 报告解读示例

ZAP HTML 报告结构：
1. **Summary of Alerts**：按风险等级汇总告警数
2. **Alert Detail**：每个告警的描述、位置、攻击载荷、修复建议
3. **References**：CWE/OWASP/WASC 编号链接

每条告警可直接复制到答辩材料。
