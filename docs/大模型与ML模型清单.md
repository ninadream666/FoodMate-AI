# FoodMate-AI 大模型与 ML 模型清单

> 本文档列出项目中所有在用的大语言模型（LLM）、机器学习模型（ML）和微调模型，包括用途、配置位置、调用链路和部署方式。

---

## 一、LLM 大语言模型（3 个）

| 模型                 | 服务                   | 用途                                                          | 状态                     |
| -------------------- | ---------------------- | ------------------------------------------------------------- | ------------------------ |
| **DeepSeek Chat**    | recommendation-service | AI 个性化推荐语生成（结合天气/健康/时段为每家餐厅写推荐理由） | ✅ 在用                   |
| **Gemini 2.5-Flash** | nutrivision-service    | 拍照识菜（菜单分析 + 单品识别兜底）                           | ✅ 在用（需有效 API Key） |
| **Gemini 2.5-Flash** | ai-pricing-service     | AI 智能定价（分析销量数据，建议调价策略）                     | ✅ 在用                   |

### 1.1 DeepSeek Chat — 智能推荐语

- **模型名称**: `deepseek-chat`
- **API 端点**: `https://api.deepseek.com/v1`
- **API Key 配置**: `backend/.env` → `DEEPSEEK_API_KEY`
- **代码位置**: `recommendation-service/app/agents/decision_agent.py` (line 639-643)
- **调用方法**: `generate_ai_reasons()` (line 1266-1415)
- **调用方式**: 通过 `AsyncOpenAI` 客户端（OpenAI 兼容 API）
- **功能细节**:
  - 为排名前 20 的餐厅生成个性化推荐理由
  - 融合当前环境信息：真实温度、天气、时段、交通状况
  - 融合用户健康数据：运动状态、压力、睡眠、活动量
  - max_tokens=1200，temperature=0.8
  - 降级策略：若 DeepSeek 不可用，使用规则引擎 `_generate_quick_reason()` 生成理由

### 1.2 Gemini 2.5-Flash — 拍照识菜（NutriVision）

- **模型名称**: `gemini-2.5-flash`
- **API 端点**: `https://yinli.one/v1/chat/completions`（OpenAI 兼容中转）
- **API Key 配置**: `backend/.env` line 75 → `GEMINI_API_KEY`
- **代码位置**: `nutrivision-service/app/core/gemini_vision.py`
- **三种调用模式**:

| 模式         | 方法                       | 输入                   | 触发条件             |
| ------------ | -------------------------- | ---------------------- | -------------------- |
| 菜单分析     | `analyze_menu()`           | Base64 图片 + 健康标签 | 用户拍菜单           |
| 单品图像兜底 | `analyze_image_fallback()` | Base64 图片            | 本地 CV 置信度 < 60% |
| 纯文本分析   | `analyze_single_food()`    | 菜品名称文本           | 本地 CV 置信度 ≥ 60% |

- **降级链**: 本地 CV 识别 → (低置信度) → Gemini 图像分析 → (API 不可用) → 返回空结果

### 1.3 Gemini 2.5-Flash — AI 智能定价

- **模型名称**: `gemini-2.5-flash`（docker-compose 覆盖）
- **API 端点**: 同上 `yinli.one`
- **代码位置**: `ai-pricing-service/app/gemini_agent.py` (line 16-95)
- **调用方法**: `GeminiClient.analyze_price()`
- **功能**:
  - 输入：菜品名称、当前价格、销量数据（数量、营收）
  - 输出：建议价格、策略类型（MARKDOWN 降价/SURGE 涨价/MAINTAIN 维持）、理由
  - 触发方式：每周定时任务 `run_pricing_cycle()` 或手动触发 `/trigger-cycle`
  - 降级策略：API 不可用时返回维持当前价格

---

## 二、ML 机器学习模型（4 个）

| 模型                | 类型      | 文件位置                          | 用途                         | 状态                       |
| ------------------- | --------- | --------------------------------- | ---------------------------- | -------------------------- |
| **LightGBM**        | GBDT 排序 | `models/lightgbm_ranking.txt`     | 餐厅排序评分（集成权重 0.6） | ✅ 在用（ml_ensemble 策略） |
| **DeepFM**          | 深度推荐  | `models/deepfm_ranking.pth`       | 餐厅排序评分（集成权重 0.4） | ✅ 在用（ml_ensemble 策略） |
| **NCF**             | 协同过滤  | `models/ncf_model.pth`            | 跨用户协同过滤               | ✅ 在用                     |
| **EfficientNet-B0** | 图像分类  | `models/efficientnet_b0_best.pth` | 本地菜品图像识别             | ⚠️ 模型文件缺失             |

### 2.1 LightGBM 排序模型

- **框架**: LightGBM (Gradient Boosting)
- **文件**: `recommendation-service/models/lightgbm_ranking.txt`
- **加载代码**: `app/ml/inference_engine.py` (line 56, 68-84)
- **特征**: 距离、评分、价格、菜系匹配、配送时间等
- **集成权重**: `ML_LGB_WEIGHT=0.6`（可通过环境变量调整）
- **启用条件**: `MAB_STRATEGY=ml_ensemble`（默认是 `contextual`）

### 2.2 DeepFM 深度推荐模型

- **框架**: PyTorch
- **文件**: `recommendation-service/models/deepfm_ranking.pth`
- **模型类**: `DeepFM`（定义在 `app/ml/train_deepfm.py`）
- **架构**: FM 层（特征交叉）+ Deep 层（MLP）
- **加载代码**: `app/ml/inference_engine.py` (line 57, 85-106)
- **集成权重**: `ML_DEEPFM_WEIGHT=0.4`
- **启用条件**: 同 LightGBM

### 2.3 NCF 协同过滤模型

- **框架**: PyTorch
- **文件**: `recommendation-service/models/ncf_model.pth`
- **模型类**: `NCFModel`（定义在 `app/ml/ncf_model.py` line 51-100）
- **架构**: GMF（广义矩阵分解）+ MLP（512→256→128）双路径融合 + Sigmoid 输出
- **调用位置**: `CollaborativeAgent` → LangGraph 编排器的协同过滤节点
- **功能**: "买了这个的人也买了…" 跨用户推荐
- **降级策略**: 模型不可用时返回空分数，不影响其他推荐流程

### 2.4 EfficientNet-B0 菜品图像分类

- **框架**: PyTorch + timm
- **文件**: `nutrivision-service/models/efficientnet_b0_best.pth`（当前缺失）
- **类别字典**: `nutrivision-service/models/class_names.txt`（当前缺失）
- **代码位置**: `nutrivision-service/app/core/food_classifier.py`
- **功能**: 拍照识菜的第一阶段——本地快速分类，置信度 ≥ 60% 时直接用结果
- **当前状态**: 模型文件未部署，分类器输出随机结果，所有请求都走 Gemini 兜底

---

## 三、微调模型（1 个）

### 3.1 FoodCF-Encoder — 美食领域语义编码器

| 属性         | 值                                              |
| ------------ | ----------------------------------------------- |
| **基座模型** | GTE-Qwen2-1.5B（阿里通义千问）                  |
| **微调方式** | LoRA/Adapter                                    |
| **文件目录** | `recommendation-service/models/foodcf_encoder/` |
| **输出维度** | 128 维（支持 Matryoshka 32/64/128 截断）        |

**目录结构**:
```
models/foodcf_encoder/
├── adapter_model.safetensors    # LoRA 微调权重
├── config.json                   # 模型配置
├── restaurant_pooling.pt         # 餐厅嵌入池化权重
├── user_pooling.pt               # 用户嵌入池化权重
├── vocab.json                    # 词表
├── merges.txt                    # BPE 合并规则
└── tokenizer_config.json         # 分词器配置
```

**微调方法（3 阶段渐进学习）**:

1. **LLM 合成数据增强**（E5-Mistral 范式）
   - 用大模型生成用户-餐厅交互样本
2. **指令感知对比学习**（NV-Embed 双向注意力，NeurIPS 2024）
   - 用户指令前缀：`"判断该用户会在哪些外卖餐厅下单："`
   - 餐厅指令前缀：`"描述这家外卖餐厅的特色："`
3. **多任务 + Matryoshka 表征学习**
   - 支持多粒度截断（32/64/128 维），推理灵活

**Latent Attention Pooling**（NV-Embed）:
- 不使用 [CLS] 或均值池化
- 学习一组可训练的 latent query，通过注意力机制聚合 token 序列
- 用户和餐厅各有独立的 pooling 权重（`user_pooling.pt`、`restaurant_pooling.pt`）

**降级链**:
```
FoodCF-Encoder 微调模型 → GTE-Qwen2 基座模型 → 简单 TF-IDF 哈希嵌入
```

**调用位置**:
- `app/ml/foodcf_encoder.py` → `get_foodcf_encoder()` 
- 被 `CollaborativeAgent` 调用，为 NCF 模型提供用户和餐厅的语义向量

---

## 四、智能推荐完整调用链

```
用户发起推荐请求（携带位置 + 健康数据 + 天气 + 忌口）
  │
  ▼
LangGraph 编排器 (langgraph_orchestrator.py)
  │
  ├─ [Node 1] ContextAgent — 环境感知
  │     ├─ 天气查询 → 和风天气 QWeather API
  │     ├─ 交通查询 → 高德地图 API
  │     ├─ 日期/节日 → calendar_service + Python
  │     └─ 附近餐厅 → 高德 POI API（20km 半径，最多 50 家）
  │
  ├─ [Node 2] ProfilerAgent — 用户画像
  │     └─ 用户偏好/历史 → profile-service (MongoDB)
  │
  ├─ [Node 3] CollaborativeAgent — 协同过滤
  │     ├─ FoodCF-Encoder (微调 Qwen2-1.5B) → 用户/餐厅语义向量
  │     └─ NCF 模型 (GMF+MLP) → 协同过滤评分
  │
  └─ [Node 4] DecisionAgent — 决策排序 + 推荐语
        │
        ├─ 忌口硬过滤（花生过敏→排除含花生餐厅）
        │
        ├─ 排序策略（二选一）:
        │   ├─ [默认] ContextualBandit — 动态权重排序
        │   │     ├─ 基础因素: 距离(0.05) + 评分(0.30) + 价格(0.20) + 菜系(0.30) + 配送(0.15)
        │   │     ├─ 强上下文时: 距离(0.02) + 菜系(0.55)（高温/大雨/运动后/健康需关注）
        │   │     └─ 上下文加成: 天气±0.65 + 健康±0.35 + 交通±0.12 + 节日+0.08
        │   │
        │   └─ [可选] ML Ensemble — 机器学习集成排序
        │         ├─ LightGBM (权重 0.6)
        │         └─ DeepFM (权重 0.4)
        │
        ├─ 健康数据加成（基于国际营养学标准）:
        │   ├─ 心率分区 (AHA) → 运动后推蛋白质，高心率推清淡
        │   ├─ 压力管理 (Harvard) → 高压推 Omega-3，避免高糖咖啡因
        │   ├─ 睡眠质量 (NSF) → 缺觉推色氨酸食物，避免兴奋剂
        │   ├─ 血氧饱和度 (WHO) → 低氧推补铁+维C+易消化
        │   └─ 活动水平 (ACSM) → 久坐推轻食，高活动推碳水蛋白
        │
        └─ DeepSeek Chat → 生成个性化推荐理由（前 20 家用 AI，其余用规则引擎）
```

---

## 五、模型配置汇总

### 环境变量（backend/.env）

| 变量名             | 值                 | 用途                           |
| ------------------ | ------------------ | ------------------------------ |
| `DEEPSEEK_API_KEY` | `sk-2985600d...`   | DeepSeek Chat API 认证         |
| `GEMINI_API_KEY`   | `sk-b6iu4vqf...`   | Gemini Vision/Pricing API 认证 |
| `GEMINI_MODEL`     | `gemini-2.5-flash` | Gemini 模型版本                |

### Docker Compose 配置（docker-compose.dev.yml）

| 变量名             | 默认值         | 说明                                                               |
| ------------------ | -------------- | ------------------------------------------------------------------ |
| `MAB_STRATEGY`     | `contextual`   | 排序策略：`contextual`(动态权重) 或 `ml_ensemble`(LightGBM+DeepFM) |
| `ML_LGB_WEIGHT`    | `0.6`          | LightGBM 在集成中的权重                                            |
| `ML_DEEPFM_WEIGHT` | `0.4`          | DeepFM 在集成中的权重                                              |
| `ML_MODEL_DIR`     | `/app/models`  | 模型文件目录                                                       |
| `ML_DATA_DIR`      | `/app/ml_data` | 训练数据目录                                                       |

### 模型训练

```bash
# 使用模拟数据冷启动训练（2000 条）
cd backend
docker compose -f docker-compose.dev.yml run --rm ml-trainer

# 有真实数据后增量训练
docker compose -f docker-compose.dev.yml run --rm ml-trainer python -m app.ml.train_all --incremental
```

---

## 六、降级策略总览

所有模型组件都有降级链，确保任一组件故障不影响核心功能：

| 组件         | 正常                                 | 降级 1                             | 降级 2                         |
| ------------ | ------------------------------------ | ---------------------------------- | ------------------------------ |
| **推荐排序** | ML Ensemble (LGB+DeepFM)             | ContextualBandit 动态权重          | 按评分+距离简单排序            |
| **协同过滤** | FoodCF-Encoder + NCF                 | GTE-Qwen2 基座 + NCF               | TF-IDF 哈希嵌入 / 跳过协同过滤 |
| **推荐语**   | DeepSeek AI 生成                     | 规则引擎（天气+健康+距离标签拼接） | "综合评分X分，值得一试"        |
| **拍照识菜** | 本地 CV (EfficientNet) + Gemini 兜底 | 直接 Gemini 图像分析               | 返回空结果                     |
| **智能定价** | Gemini 分析                          | 维持当前价格                       | —                              |
