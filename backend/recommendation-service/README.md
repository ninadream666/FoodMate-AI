# 🤖 智能餐厅推荐服务

基于多智能体协作的智能餐厅推荐系统，采用 LangGraph 实现图状态机编排。

## ✨ 核心特性

### 🆕 多智能体协作架构 (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Orchestrator                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │ ContextAgent │ -> │ ProfilerAgent│ -> │DecisionAgent │  │
│   │  环境感知    │    │  用户画像    │    │   MAB决策    │  │
│   └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│   • 天气分析         • 偏好分析         • UCB1算法        │
│   • 交通分析         • 意图识别         • Thompson采样    │
│   • 时间感知         • 用户分群         • ε-Greedy       │
│   • 环境评估         • 权重计算         • 上下文感知MAB   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 智能体详情

| 智能体            | 职责     | 能力                                         |
| ----------------- | -------- | -------------------------------------------- |
| **ContextAgent**  | 环境感知 | 天气分析、交通分析、时间上下文、综合影响评估 |
| **ProfilerAgent** | 用户画像 | 偏好分析、意图识别、用户分群、权重计算       |
| **DecisionAgent** | 智能决策 | MAB排序、在线学习、推理生成、策略切换        |

#### MAB (Multi-Armed Bandit) 策略

- **UCB1**: Upper Confidence Bound - 探索与利用的平衡
- **Thompson Sampling**: 贝叶斯方法 - 基于概率采样
- **ε-Greedy**: 简单探索策略 - 以ε概率随机探索
- **Contextual MAB**: 上下文感知 - 综合距离、评分、价格等多因素

### 传统推荐特性

- 🌤️ **天气感知推荐**：根据当前天气状况推荐合适的餐厅
- 🍂 **节气时令推荐**：基于二十四节气推荐应季美食
- ⏰ **时间场景推荐**：根据用餐时间和场景智能匹配
- 🚗 **交通状况感知**：考虑交通拥堵情况优化配送时间
- 📍 **地理位置优化**：基于用户位置推荐附近优质餐厅

## 项目结构

```
recommendation-service/
├── app/
│   ├── main.py                     # 主应用文件
│   ├── config.py                   # 配置文件
│   ├── agents/                     # 🆕 多智能体模块
│   │   ├── __init__.py
│   │   ├── base_agent.py           # 基础智能体类
│   │   ├── context_agent.py        # 环境感知智能体
│   │   ├── profiler_agent.py       # 用户画像智能体
│   │   ├── decision_agent.py       # 决策智能体 (MAB)
│   │   └── langgraph_orchestrator.py  # LangGraph 编排器
│   ├── api/
│   │   ├── recommendations.py      # V1 推荐 API
│   │   ├── multi_agent_api.py      # 🆕 V2 多智能体 API
│   │   └── health.py               # 健康检查
│   ├── models/
│   │   └── schemas.py              # 数据模型
│   └── services/
│       ├── external_api.py         # 外部API集成
│       ├── amap_poi_service.py     # 高德 POI 服务
│       ├── mcp_recommendation_service.py  # MCP 推荐服务
│       └── multi_agent_recommendation_service.py  # 🆕 多智能体服务
├── agent_orchestrator.py           # ReAct 编排器
├── mcp_client.py                   # MCP 客户端
├── delivery_mcp_server.py          # MCP 服务器
├── enhanced_mcp_server.py          # 🆕 增强版 MCP 服务器
├── test_multi_agent_system.py      # 🆕 测试脚本
├── requirements.txt                # Python依赖
├── Dockerfile                      # Docker配置
└── README.md                       # 说明文档
```

## 安装和运行

### 1. 安装依赖

```bash
cd recommendation-service
pip install -r requirements.txt
```

### 2. 配置API密钥

复制`.env.example`为`.env`并配置以下环境变量：

```bash
cp .env.example .env
```

编辑`.env`文件：

```env
# 和风天气API密钥 (推荐)
# 获取地址: https://dev.qweather.com/
QWEATHER_API_KEY=your_qweather_api_token
QWEATHER_API_HOST=devapi.qweather.com

# 高德地图API密钥
# 获取地址: https://console.amap.com/
MAP_API_KEY=your_amap_api_key

# 可选配置
DEBUG=false
LOG_LEVEL=INFO
```

#### API配置指南：

##### **和风天气API（推荐JWT认证）**：

1. **生成Ed25519密钥对**：
   ```bash
   openssl genpkey -algorithm ED25519 -out ed25519-private.pem \
   && openssl pkey -pubout -in ed25519-private.pem > ed25519-public.pem
   ```

2. **配置和风天气控制台**：
   - 访问 [和风天气开发平台](https://dev.qweather.com/)
   - 注册账号并创建项目
   - 前往控制台-项目管理
   - 点击"添加凭据"，选择"JSON Web Token"
   - 上传`ed25519-public.pem`的内容
   - 记录凭据ID和项目ID

3. **配置环境变量**：
   - 将私钥内容填入`QWEATHER_PRIVATE_KEY`
   - 或将`ed25519-private.pem`放在项目根目录
   - 填入`QWEATHER_KEY_ID`和`QWEATHER_PROJECT_ID`

##### **备选：API Key认证**：
   - 在`.env`中设置`QWEATHER_USE_JWT=false`
   - 填入`QWEATHER_API_KEY`

##### **高德地图API**：
   - 访问 [高德开放平台](https://console.amap.com/)
   - 注册账号并创建应用
   - 获取Web服务API Key

### 3. 测试API集成

在启动服务前，建议先测试API集成：

```bash
# 测试JWT认证配置（推荐）
python test_jwt_weather.py

# 或测试传统API Key认证
python test_weather_api.py
```

### 4. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. 使用Docker

```bash
# 构建镜像
docker build -t recommendation-service .

# 运行容器
docker run -p 8000:8000 -e WEATHER_API_KEY=your_key -e MAP_API_KEY=your_key recommendation-service
```

## API使用

服务启动后访问 `http://localhost:8000/docs` 查看完整API文档。

### 🆕 V2 多智能体接口 (推荐)

#### 智能推荐

```http
POST /api/v2/agents/recommend
Content-Type: application/json

{
    "location": {
        "address": "深圳市南山区科技园",
        "latitude": 22.5431,
        "longitude": 114.0579
    },
    "max_results": 10
}
```

**响应示例:**

```json
{
    "context": {
        "weather": "小雨",
        "temperature": 18,
        "traffic_level": "缓行"
    },
    "restaurants": [
        {
            "id": "r001",
            "name": "海底捞火锅",
            "cuisine_type": "火锅",
            "rating": 4.8,
            "match_score": 92.5,
            "match_reasons": ["🤖 智能推荐理由：天气较冷，为您推荐热食类餐厅..."]
        }
    ],
    "total_count": 10,
    "message": "🤖 AI智能体为您精选推荐"
}
```

#### 更新反馈 (在线学习)

```http
POST /api/v2/agents/feedback?restaurant_id=r001&reward=1.0&feedback_type=order
```

#### 切换 MAB 策略

```http
PUT /api/v2/agents/strategy?strategy=thompson
```

#### 获取系统状态

```http
GET /api/v2/agents/status
```

### V1 传统接口

#### 1. 智能推荐接口

```http
POST /api/v1/recommendations/recommend
```

请求示例：
```json
{
  "location": {
    "address": "北京市朝阳区三里屯"
  },
  "user_preferences": {
    "cuisine_types": ["川菜", "江浙菜"],
    "spice_level": "微辣"
  },
  "budget_range": [20, 80],
  "max_delivery_time": 45
}
```

#### 2. 获取上下文信息

```http
GET /api/v1/recommendations/context?address=北京市朝阳区三里屯
```

#### 3. 推荐理由解释

```http
GET /api/v1/recommendations/restaurants/r001/explain?address=北京市朝阳区三里屯
```

## 🧪 运行测试

```bash
# 运行多智能体系统测试
python test_multi_agent_system.py
```

测试输出示例:

```
🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖
     智能外卖推荐 - 多智能体系统测试
🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖

============================================================
🔹 测试 ContextAgent (环境感知智能体)
============================================================
✅ 成功: True
📍 天气状况: 晴
🌡️ 温度: 25°C
🚦 交通状况: 畅通
⏰ 用餐时段: lunch

============================================================
🔹 测试 LangGraph Orchestrator (完整编排流程)
============================================================
✅ 成功: True
⏱️ 处理时间: 156.3ms
📍 节点历史: context_analysis → profile_analysis → decision_making
```

## 推荐算法

系统采用多维度评分机制：

- **天气因素** (25%): 根据温度、天气状况推荐热食/冷食
- **节气因素** (20%): 基于二十四节气推荐应季美食
- **时间因素** (20%): 考虑用餐时间、工作日/周末
- **交通因素** (15%): 根据拥堵情况优化配送时间
- **距离因素** (10%): 优先推荐附近餐厅
- **评分因素** (10%): 用户口碑评分

## 扩展功能

### 数据库集成
可以集成MySQL、PostgreSQL等数据库存储餐厅信息：

```python
# 在config.py中配置
DATABASE_URL = "mysql://user:password@localhost/recommendation_db"
```

### 缓存优化
可以集成Redis缓存提升响应速度：

```python
# 在config.py中配置
REDIS_URL = "redis://localhost:6379"
```

### 机器学习增强
可以集成机器学习模型提升推荐精度：

- 用户行为分析
- 协同过滤
- 深度学习推荐模型

## 监控和日志

服务提供健康检查和状态监控接口：

- 健康检查: `GET /health`
- 服务状态: `GET /api/v1/status`

## 开发指南

### 添加新的推荐因子

1. 在 `external_api.py` 中添加新的API集成
2. 在 `recommendation_engine.py` 中添加新的评分算法
3. 在 `config.py` 中添加相应权重配置

### 添加新的餐厅属性

1. 更新 `Restaurant` 数据类
2. 修改推荐算法考虑新属性
3. 更新API响应模型

## 📊 架构优势

1. **模块化设计**: 每个智能体独立实现，易于扩展和维护
2. **图状态机编排**: 基于 LangGraph 实现灵活的工作流控制
3. **在线学习**: MAB 算法支持从用户反馈中持续学习
4. **策略可切换**: 支持运行时动态切换推荐策略
5. **降级容错**: 智能体失败时自动降级到备用方案
6. **MCP 协议**: 符合标准协议，支持即插即用

## 📝 更新日志

### v2.0.0 (2024-11)
- 🆕 新增 LangGraph 多智能体编排框架
- 🆕 实现 ContextAgent、ProfilerAgent、DecisionAgent 三个核心智能体
- 🆕 集成 MAB (多臂老虎机) 推荐算法
- 🆕 支持在线学习和策略切换
- 🆕 新增 V2 API 接口

### v1.0.0
- 初始版本
- MCP 智能体编排
- 基础推荐功能

## 许可证

MIT License