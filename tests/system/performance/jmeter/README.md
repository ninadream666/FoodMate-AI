# JMeter 负载测试 — FoodMate-AI

## 测试目标

与 Locust 一致：10 并发用户、60 秒、混合读写场景，覆盖商户查询 / 我的订单 / 个人资料 / 创建订单 4 个核心接口；接口比例 5:3:2:1。

## 文件清单

| 文件 | 说明 |
|------|------|
| `foodmate_load_test.jmx` | JMeter 测试计划（GUI 可直接打开） |
| `result_jmeter_summary.csv` | 运行后自动生成的聚合报告（CSV） |
| `report/` | 运行后自动生成的 HTML 报告目录 |

## 安装 JMeter

1. 下载 [Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi)（Binary `apache-jmeter-5.6.3.zip`）
2. 解压到 `D:\DevTools\apache-jmeter-5.6.3\`
3. 配置环境变量 `JMETER_HOME=D:\DevTools\apache-jmeter-5.6.3`，`PATH` 加入 `%JMETER_HOME%\bin`

## 启动服务

JMeter 测试需要后端服务全部就绪（与 Locust 相同）：

```cmd
cd D:\FoodMate-AI\backend
docker compose -f docker-compose.dev.yml up -d
:: 等待 60-90 秒待全部 9 个微服务就绪
```

## 运行方式

### 方式 1：GUI 模式（推荐用于调试）

```cmd
cd D:\FoodMate-AI\tests\system\performance\jmeter
jmeter -t foodmate_load_test.jmx
```

打开 GUI 后：
1. 左侧树展开 "FoodMate-AI 负载测试计划"
2. 顶部菜单 **运行 (Run) → 启动 (Start)**（或 Ctrl+R）
3. 观察 "聚合报告" 与 "查看结果树"

### 方式 2：命令行无头模式（推荐用于自动化执行）

```cmd
cd D:\FoodMate-AI\tests\system\performance\jmeter

:: 删除旧报告
rmdir /s /q report 2>nul
del result_jmeter_summary.csv 2>nul

:: 运行测试 + 自动生成 HTML 报告
jmeter -n -t foodmate_load_test.jmx ^
    -l result_jmeter_summary.csv ^
    -e -o report
```

参数说明：
- `-n`：non-GUI 模式
- `-t`：测试计划路径
- `-l`：日志/结果文件
- `-e`：测试结束后生成 HTML 报告
- `-o`：HTML 报告输出目录

执行结束后，浏览器打开 `report/index.html` 查看完整 HTML 报告（含响应时间分布、吞吐量曲线、错误率等）。

## 测试计划结构

```
FoodMate-AI 负载测试计划
├── 用户定义变量（HOST=localhost, PORT 等）
├── setUp Thread Group：注册 + 登录 → 全局 token
│   ├── 生成唯一用户名（BeanShell PreProcessor）
│   ├── POST /auth/register
│   └── POST /auth/login → 提取 token 到全局属性
├── 主负载 Thread Group（10 用户 / 60 秒）
│   ├── Bearer 认证头
│   ├── ThroughputController：商户列表查询 45.5%
│   ├── ThroughputController：我的订单 27.3%
│   ├── ThroughputController：个人资料 18.2%
│   ├── ThroughputController：创建订单 9.0%
│   └── 思考时间 1-3 秒
└── 监听器：聚合报告 + 查看结果树
```

## 与 Locust 对比

| 维度 | Locust | JMeter |
|------|--------|--------|
| 配置方式 | Python 脚本 | XML / GUI |
| 学习曲线 | 平缓（写代码） | 中（GUI + XML） |
| 调试便利度 | 中（输出 print） | 高（GUI 实时查看） |
| HTML 报告 | 内置 | 内置（更丰富） |
| 生态成熟度 | 中 | 高（行业标准） |

两者并行保留，可根据需要选用。

## 预期结果

参考 Locust 已有数据（10 并发 / 60 秒 / 267 请求 / 失败率 0%）：

| 接口 | 平均响应 | P95 | 失败率 |
|------|---------|-----|--------|
| 商户列表 | ~50 ms | ~100 ms | 0% |
| 我的订单 | ~55 ms | ~130 ms | 0% |
| 个人资料 | ~50 ms | ~110 ms | 0% |
| 创建订单 | ~95 ms | ~170 ms | 0% |

JMeter 测试结果应与 Locust 相近（误差 ±15% 内）。
