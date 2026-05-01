# OWASP ZAP 扫描策略

本扫描策略针对 FoodMate-AI 微服务架构定制，分两轮执行：

## 第一轮：Baseline Scan（被动扫描，5–10 分钟）

仅做被动检查，不发起攻击载荷，安全（生产环境也可用）：

| 检查项 | 说明 |
|-------|------|
| HTTP 头部安全配置 | X-Content-Type-Options、X-Frame-Options、Strict-Transport-Security |
| Cookie 安全标志 | HttpOnly、Secure、SameSite |
| 信息泄露 | 服务器版本、错误堆栈、注释中的敏感信息 |
| TLS/SSL 配置 | 证书有效性、密码套件 |
| CSP 策略 | Content-Security-Policy 配置 |

## 第二轮：Full Active Scan（主动扫描，30–90 分钟）

ZAP 主动发起攻击载荷探测漏洞，**仅在测试环境运行**：

| 检查项 | 攻击向量 |
|-------|---------|
| SQL 注入 | UNION、Boolean、Time-based、Error-based |
| XSS | Reflected、Stored、DOM-based |
| 命令注入 | OS Command Injection |
| 路径遍历 | `../../etc/passwd` |
| LDAP 注入 | `*)(uid=*` |
| XML 注入 | XXE、XML 实体注入 |
| CSRF | Token 验证缺失 |
| 不安全的反序列化 | Java/Python 反序列化漏洞 |
| 已知漏洞组件 | 依赖库 CVE 检测 |

## 扫描范围

| 模块 | URL | 扫描类型 |
|------|-----|---------|
| user-service | http://localhost:8083 | Baseline + Active |
| merchant-service | http://localhost:8081 | Baseline + Active |
| order-service | http://localhost:8084 | Baseline + Active |
| marketing-service | http://localhost:8082 | Baseline + Active |
| profile-service | http://localhost:8086 | Baseline + Active |
| platform-service | http://localhost:8088 | Baseline + Active |
| recommendation-service | http://localhost:8087 | Baseline + Active |
| ai-pricing-service | http://localhost:8089 | Baseline + Active |
| nutrivision-service | http://localhost:8090 | Baseline |

## 风险等级判定

| 等级 | 含义 | 处理优先级 |
|------|------|----------|
| High | 可被远程利用造成数据泄露/系统接管 | 当日修复 |
| Medium | 需特定条件触发的漏洞 | 一周内修复 |
| Low | 配置缺陷或信息泄露 | 一月内修复 |
| Informational | 提示性信息，非漏洞 | 视情况修复 |

## 与已有手工注入测试的关系

| 维度 | 手工测试（test_input_validation.py） | ZAP 自动扫描 |
|------|----------------------------------|-------------|
| 用例数 | 14（5 SQL 注入 + 4 XSS + 5 校验） | 数百+（含已知 CVE 库） |
| 速度 | 秒级 | 30-90 分钟 |
| 维护成本 | 测试代码需手写 | 规则库自动更新 |
| 可重复性 | 高（CI 集成方便） | 中（需启动 GUI 或专用容器）|
| 对未知漏洞的覆盖 | 低 | 高 |

两者**互补**：手工注入用例做快速回归（CI 每次跑），ZAP 做月度深度扫描。
