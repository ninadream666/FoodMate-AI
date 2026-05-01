# -*- coding: utf-8 -*-
"""
白盒覆盖扩展测试 — DecisionAgent 深度测试

针对 backend/recommendation-service/app/agents/decision_agent.py 的
未覆盖代码路径补充测试，目标将该文件覆盖率从 ~20% 提升至 ~55%，
整体覆盖率从 23% 提升至 ~40%。

测试策略：
- Plan B（纯同步）：直接调用 _build_decision_context、_extract_features、
  _restaurants_to_arms、_arms_to_recommendations、_generate_quick_reason、
  _calculate_display_score、_calculate_confidence、update_reward、set_strategy
- Plan C（异步 + AsyncMock）：用 unittest.mock.AsyncMock 伪造 LLM 客户端，
  覆盖 process()、generate_ai_reasons()、_generate_reasoning()、
  _make_decision_handler()、_update_reward_handler()

运行：
    python -m pytest tests/coverage/test_whitebox_decision_agent_extended.py \
        --cov-config=tests/coverage/.coveragerc \
        --cov=backend/recommendation-service/app \
        --cov-report=term-missing
"""
import os
import sys
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REC_PATH = os.path.join(ROOT, "backend", "recommendation-service")
if REC_PATH not in sys.path:
    sys.path.insert(0, REC_PATH)


# ==================== Plan B：纯同步方法测试 ====================
class TestDecisionAgentSyncMethods:
    """覆盖 DecisionAgent 中不依赖 LLM 的所有同步方法"""

    def setup_method(self):
        from app.agents.decision_agent import DecisionAgent
        # 提供假 LLM 客户端，避免实例化 AsyncOpenAI
        self.agent = DecisionAgent(strategy="contextual", llm_client=MagicMock())

    # ---------- _extract_features ----------
    def test_extract_features_full_fields(self):
        r = {
            "id": "r1", "name": "测试餐厅", "distance": 1200, "rating": 4.6,
            "avg_price": 55, "cuisine_type": "川菜",
            "estimated_delivery_time": 28, "is_hot_food": True,
            "order_count": 320, "image": "img.png", "address": "北京海淀"
        }
        feats = self.agent._extract_features(r)
        assert feats["distance"] == 1200
        assert feats["rating"] == 4.6
        assert feats["price"] == 55
        assert feats["cuisine"] == "川菜"
        assert feats["delivery_time"] == 28
        assert feats["is_hot_food"] is True
        assert feats["order_count"] == 320
        assert feats["image"] == "img.png"
        assert feats["address"] == "北京海淀"

    def test_extract_features_defaults_when_missing(self):
        feats = self.agent._extract_features({})
        assert feats["distance"] == 2000
        assert feats["rating"] == 4.0
        assert feats["price"] == 40
        assert feats["cuisine"] == ""
        assert feats["delivery_time"] == 30
        assert feats["is_hot_food"] is True

    # ---------- _build_decision_context ----------
    def test_build_decision_context_full(self):
        ctx_analysis = {
            "environment_impact": {"recommended_max_distance": 8000},
            "weather": {"is_bad_weather": True, "condition": "暴雨"},
            "traffic": {"congestion_index": 1.8},
            "temporal": {"is_peak_hour": True, "meal_period": "lunch"},
            "health_context": {"is_post_workout": True}
        }
        prof_analysis = {
            "profile": {
                "user_segment": "premium",
                "price_range": {"min": 30, "max": 200},
                "preferred_cuisines": ["日料"]
            },
            "recommendation_weights": {
                "distance": 0.3, "rating": 0.3, "price": 0.1,
                "cuisine_match": 0.2, "delivery_time": 0.1
            },
            "adjusted_preferences": {"cuisines": ["日料", "西餐"]},
            "intent_analysis": {"urgency": "urgent"}
        }
        dc = self.agent._build_decision_context(ctx_analysis, prof_analysis)
        assert dc["max_distance"] == 8000
        assert dc["min_price"] == 30
        assert dc["max_price"] == 200
        assert dc["urgency"] == "urgent"
        assert dc["is_bad_weather"] is True
        assert dc["is_peak_hour"] is True
        assert dc["congestion_index"] == 1.8
        assert dc["user_segment"] == "premium"
        assert dc["preferred_cuisines"] == ["日料", "西餐"]
        # 权重透传
        assert dc["weights"]["distance"] == 0.3
        # health_context 透传
        assert dc["health_context"]["is_post_workout"] is True

    def test_build_decision_context_empty_uses_defaults(self):
        dc = self.agent._build_decision_context({}, {})
        # 默认权重存在
        assert "weights" in dc
        assert abs(sum(dc["weights"].values()) - 1.0) < 1e-6
        assert dc["max_distance"] == 20000
        assert dc["min_price"] == 0
        assert dc["max_price"] == 100
        assert dc["urgency"] == "normal"
        assert dc["user_segment"] == "standard"

    # ---------- _restaurants_to_arms ----------
    def test_restaurants_to_arms_creates_new(self):
        restaurants = [
            {"id": "r1", "name": "店1", "rating": 4.5, "distance": 800},
            {"id": "r2", "name": "店2", "rating": 4.0, "distance": 1500},
        ]
        arms = self.agent._restaurants_to_arms(restaurants)
        assert len(arms) == 2
        assert arms[0].pulls == 0
        assert arms[0].name == "店1"
        # 历史已记录
        assert "r1" in self.agent._arms_history
        assert "r2" in self.agent._arms_history

    def test_restaurants_to_arms_reuses_history(self):
        # 先注入一条历史
        from app.agents.decision_agent import RestaurantArm
        old = RestaurantArm(
            restaurant_id="r1", name="老店", pulls=15, rewards=10.0,
            features={"distance": 1000, "rating": 4.5}
        )
        self.agent._arms_history["r1"] = old

        arms = self.agent._restaurants_to_arms([
            {"id": "r1", "name": "老店", "rating": 4.6, "distance": 1100}
        ])
        # 历史 pulls/rewards 保留
        assert arms[0].pulls == 15
        assert arms[0].rewards == 10.0
        # 但特征已被新数据更新
        assert arms[0].features["distance"] == 1100
        assert arms[0].features["rating"] == 4.6

    def test_restaurants_to_arms_uses_object_id_when_no_id(self):
        restaurants = [{"name": "无ID店", "rating": 4.0}]
        arms = self.agent._restaurants_to_arms(restaurants)
        assert len(arms) == 1
        # restaurant_id 应是 str(id(obj))
        assert arms[0].restaurant_id.isdigit()

    # ---------- _arms_to_recommendations ----------
    def test_arms_to_recommendations_basic(self):
        from app.agents.decision_agent import RestaurantArm
        arms = [
            RestaurantArm(
                restaurant_id="r1", name="阳光餐厅", pulls=8, rewards=4.8,
                features={"distance": 1200, "rating": 4.5, "price": 35,
                          "cuisine": "川菜", "delivery_time": 25}
            ),
            RestaurantArm(
                restaurant_id="r2", name="月光餐厅", pulls=3, rewards=2.0,
                features={"distance": 600, "rating": 4.2, "price": 28,
                          "cuisine": "粤菜", "delivery_time": 18}
            ),
        ]
        ctx = {"environment": {"weather": {"temperature": 22, "condition": "晴"},
                                "temporal": {"meal_period": "lunch", "hour": 12},
                                "traffic": {"congestion_index": 1.0}}}
        recs = self.agent._arms_to_recommendations(arms, ctx)
        assert len(recs) == 2
        assert recs[0]["rank"] == 1
        assert recs[0]["name"] == "阳光餐厅"
        # 关键字段已暴露
        assert recs[0]["rating"] == 4.5
        assert recs[0]["distance"] == 1200
        assert recs[0]["estimated_delivery_time"] == 25
        assert recs[0]["cuisine_type"] == "川菜"
        assert recs[0]["avg_price"] == 35
        # MAB 统计
        assert recs[0]["mab_stats"]["pulls"] == 8
        assert abs(recs[0]["mab_stats"]["average_reward"] - 0.6) < 1e-6
        # reason 字段非空
        assert isinstance(recs[0]["reason"], str)
        assert len(recs[0]["reason"]) > 0

    # ---------- _generate_quick_reason ----------
    def test_quick_reason_cold_weather_hotpot(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="麻辣火锅", pulls=10, rewards=7,
            features={"distance": 800, "rating": 4.6, "price": 80,
                      "cuisine": "火锅", "delivery_time": 25}
        )
        ctx = {"environment": {
            "weather": {"temperature": 5, "condition": "晴", "is_bad_weather": False},
            "temporal": {"meal_period": "dinner", "hour": 18,
                          "is_weekend": False, "is_holiday": False},
            "traffic": {"congestion_level": "畅通", "congestion_index": 1.0}
        }, "health_context": {}}
        reason = self.agent._generate_quick_reason(arm, ctx, rank=1, score=88)
        # 寒冷 + 火锅 → 应包含暖身相关词
        assert "今日首推" in reason
        assert any(k in reason for k in ["天寒", "暖身", "5°C"])

    def test_quick_reason_hot_weather_with_post_workout(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="健身轻食", pulls=8, rewards=5.0,
            features={"distance": 600, "rating": 4.4, "price": 45,
                      "cuisine": "轻食沙拉", "delivery_time": 18}
        )
        ctx = {"environment": {
            "weather": {"temperature": 32, "condition": "晴", "is_bad_weather": False},
            "temporal": {"meal_period": "lunch", "hour": 12,
                          "is_weekend": True, "is_holiday": False},
            "traffic": {"congestion_level": "畅通", "congestion_index": 1.0}
        }, "health_context": {"is_post_workout": True, "daily_steps": 12000}}
        reason = self.agent._generate_quick_reason(arm, ctx, rank=1, score=90)
        assert "今日首推" in reason
        # 高温 + 健身轻食 命中冷食关键词，运动后命中健康关键词
        assert any(k in reason for k in ["高温", "解暑", "运动后", "活动量"])

    def test_quick_reason_rainy_weather_hot_food(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="砂锅粥", pulls=5, rewards=3,
            features={"distance": 1200, "rating": 4.3, "price": 30,
                      "cuisine": "粥", "delivery_time": 28}
        )
        ctx = {"environment": {
            "weather": {"temperature": 18, "condition": "大雨", "is_bad_weather": True},
            "temporal": {"meal_period": "dinner", "hour": 19},
            "traffic": {"congestion_level": "拥堵", "congestion_index": 1.7}
        }, "health_context": {}}
        reason = self.agent._generate_quick_reason(arm, ctx, rank=2, score=85)
        assert "精选好店" in reason
        # 大雨 + 粥 → 应命中暖胃首选
        assert any(k in reason for k in ["大雨", "暖胃", "配送快"])

    def test_quick_reason_no_special_context_uses_fallback(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="普通店", pulls=2, rewards=1,
            features={"distance": 5000, "rating": 3.5, "price": 200,
                      "cuisine": "无标签", "delivery_time": 60}
        )
        ctx = {"environment": {}, "health_context": {}}
        reason = self.agent._generate_quick_reason(arm, ctx, rank=10, score=72)
        # 没命中任何强模板，但仍返回非空字符串
        assert isinstance(reason, str)
        assert len(reason) > 0

    # ---------- _calculate_display_score ----------
    def test_display_score_uses_ml_score_when_present(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="ML店", pulls=10, rewards=5,
            features={"_ml_score": 0.7, "rating": 4.5, "distance": 1000}
        )
        score = self.agent._calculate_display_score(arm, {})
        # 0.7 * 40 + 60 = 88
        assert abs(score - 88.0) < 0.5

    def test_display_score_contextual_strategy_in_range(self):
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="店A", pulls=5, rewards=2.5,
            features={"distance": 1500, "rating": 4.4, "price": 40,
                      "cuisine": "川菜", "delivery_time": 22}
        )
        ctx = {"max_distance": 20000, "max_price": 100, "min_price": 0,
               "preferred_cuisines": ["川菜"]}
        score = self.agent._calculate_display_score(arm, ctx)
        # 强制限定在 60-100
        assert 60.0 <= score <= 100.0

    def test_display_score_non_contextual_strategy(self):
        from app.agents.decision_agent import DecisionAgent
        agent = DecisionAgent(strategy="ucb1", llm_client=MagicMock())
        from app.agents.decision_agent import RestaurantArm
        arm = RestaurantArm(
            restaurant_id="r", name="UCB店", pulls=10, rewards=8,
            features={"rating": 4.5, "distance": 2000}
        )
        score = agent._calculate_display_score(arm, {})
        assert 0.0 <= score <= 100.0

    # ---------- _calculate_confidence ----------
    def test_confidence_empty_returns_zero(self):
        assert self.agent._calculate_confidence([], {}, {}) == 0.0

    def test_confidence_full_data_caps_at_0_95(self):
        # 注入一条 pulls > 10 的历史
        from app.agents.decision_agent import RestaurantArm
        self.agent._arms_history["r1"] = RestaurantArm(
            restaurant_id="r1", name="老店", pulls=15, rewards=10
        )
        recs = [{"restaurant_id": "r1"}, {"restaurant_id": "r2"},
                {"restaurant_id": "r3"}, {"restaurant_id": "r4"},
                {"restaurant_id": "r5"}]
        ctx_analysis = {"weather": {"temp": 22}, "traffic": {"congestion": 1.0}}
        prof_analysis = {"profile": {"user_segment": "standard"}}
        conf = self.agent._calculate_confidence(recs, ctx_analysis, prof_analysis)
        # 0.7 + 0.05 + 0.05 + 0.05 + 0.05 + 0.05 = 0.95（被 cap）
        assert conf == 0.95

    def test_confidence_only_basic(self):
        recs = [{"restaurant_id": "r1"}]
        conf = self.agent._calculate_confidence(recs, {}, {})
        # 仅基础置信度
        assert conf == 0.7

    # ---------- update_reward ----------
    def test_update_reward_existing_arm(self):
        from app.agents.decision_agent import RestaurantArm
        self.agent._arms_history["r1"] = RestaurantArm(
            restaurant_id="r1", name="店1", pulls=2, rewards=1.0
        )
        self.agent.update_reward("r1", 0.9)
        arm = self.agent._arms_history["r1"]
        assert arm.pulls == 3
        assert abs(arm.rewards - 1.9) < 1e-6

    def test_update_reward_unknown_arm_is_silent(self):
        # 不应抛错
        self.agent.update_reward("nonexistent", 0.5)

    # ---------- set_strategy ----------
    def test_set_strategy_switches(self):
        from app.agents.decision_agent import (
            UCB1Strategy, ThompsonSamplingStrategy, EpsilonGreedyStrategy
        )
        self.agent.set_strategy("ucb1")
        assert self.agent.strategy_name == "ucb1"
        assert isinstance(self.agent.strategy, UCB1Strategy)

        self.agent.set_strategy("thompson")
        assert isinstance(self.agent.strategy, ThompsonSamplingStrategy)

        self.agent.set_strategy("epsilon")
        assert isinstance(self.agent.strategy, EpsilonGreedyStrategy)

    def test_set_strategy_unknown_falls_back_to_contextual(self):
        from app.agents.decision_agent import ContextualBanditStrategy
        self.agent.set_strategy("nonsense_strategy")
        assert isinstance(self.agent.strategy, ContextualBanditStrategy)

    def test_set_strategy_ml_ensemble_falls_back_when_unavailable(self):
        # 即使 ML 模块不可用，也应能成功切换且降级到 contextual
        from app.agents.decision_agent import ContextualBanditStrategy, ML_AVAILABLE
        self.agent.set_strategy("ml_ensemble")
        # 无论 ML 是否可用，都应得到一个可调用的策略
        assert hasattr(self.agent.strategy, "rank_all")
        if not ML_AVAILABLE:
            assert isinstance(self.agent.strategy, ContextualBanditStrategy)

    # ---------- get_capabilities ----------
    def test_get_capabilities_returns_known_list(self):
        caps = self.agent.get_capabilities()
        assert "mab_decision" in caps
        assert "ranking" in caps
        assert "reasoning_generation" in caps
        assert "reward_learning" in caps


# ==================== Plan C：异步方法 + AsyncMock ====================
class TestDecisionAgentAsyncMethods:
    """覆盖 process / generate_ai_reasons / _generate_reasoning / _make_decision_handler / _update_reward_handler"""

    def setup_method(self):
        from app.agents.decision_agent import DecisionAgent
        # 构造 AsyncMock LLM 客户端，模拟 OpenAI SDK 的链式调用
        self.mock_llm = MagicMock()
        self.mock_llm.chat = MagicMock()
        self.mock_llm.chat.completions = MagicMock()
        # AsyncMock 用于 await
        fake_response = MagicMock()
        fake_response.choices = [
            MagicMock(message=MagicMock(content=(
                "1. 寒冷天气，热汤暖身首选\n"
                "2. 高分好评，今日精选推荐\n"
                "3. 距离近配送快，省时之选\n"
            )))
        ]
        self.mock_llm.chat.completions.create = AsyncMock(return_value=fake_response)
        self.agent = DecisionAgent(strategy="contextual", llm_client=self.mock_llm)

    def _sample_restaurants(self):
        return [
            {"id": "r1", "name": "火锅店A", "rating": 4.7, "distance": 800,
             "avg_price": 80, "cuisine_type": "火锅", "estimated_delivery_time": 25,
             "is_hot_food": True},
            {"id": "r2", "name": "粤菜B", "rating": 4.5, "distance": 1500,
             "avg_price": 60, "cuisine_type": "粤菜", "estimated_delivery_time": 30,
             "is_hot_food": True},
            {"id": "r3", "name": "轻食C", "rating": 4.3, "distance": 600,
             "avg_price": 40, "cuisine_type": "轻食", "estimated_delivery_time": 20,
             "is_hot_food": False},
        ]

    def _sample_context_analysis(self):
        return {
            "environment_impact": {"recommended_max_distance": 15000},
            "weather": {"temperature": 8, "condition": "小雨", "is_bad_weather": False, "humidity": 70},
            "traffic": {"congestion_level": "畅通", "congestion_index": 1.0},
            "temporal": {"meal_period": "lunch", "hour": 12, "is_weekend": False, "is_holiday": False},
        }

    def _sample_profile_analysis(self):
        return {
            "profile": {
                "user_segment": "standard",
                "price_range": {"min": 0, "max": 150},
                "preferred_cuisines": ["火锅", "粤菜"]
            },
            "recommendation_weights": {
                "distance": 0.25, "rating": 0.25, "price": 0.20,
                "cuisine_match": 0.20, "delivery_time": 0.10
            },
            "adjusted_preferences": {"cuisines": ["火锅", "粤菜"]},
            "intent_analysis": {"urgency": "normal",
                                  "detected_keywords": [{"value": "火锅"}]}
        }

    # ---------- process()：完整推荐链路 ----------
    @pytest.mark.asyncio
    async def test_process_full_pipeline(self):
        result = await self.agent.process({
            "restaurants": self._sample_restaurants(),
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "user_query": "想吃点暖和的",
            "top_k": 3
        })
        assert result["success"] is True
        assert result["agent"] == "DecisionAgent"
        assert len(result["recommendations"]) == 3
        assert result["strategy_used"] == "contextual"
        assert result["total_candidates"] == 3
        assert isinstance(result["confidence_score"], float)
        # AI 理由应被采纳（mock 返回 3 条）
        assert all(isinstance(r["reason"], str) for r in result["recommendations"])

    @pytest.mark.asyncio
    async def test_process_empty_restaurants_returns_failure(self):
        result = await self.agent.process({
            "restaurants": [],
            "context_analysis": {},
            "profile_analysis": {}
        })
        assert result["success"] is False
        assert "No restaurants" in result["error"]

    @pytest.mark.asyncio
    async def test_process_with_health_context_post_workout(self):
        """运动后 health_context 应被注入到 decision_context"""
        result = await self.agent.process({
            "restaurants": self._sample_restaurants(),
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "health_context": {
                "is_post_workout": True,
                "daily_steps": 12000,
                "pure_query": "运动后吃什么"
            },
            "top_k": 3
        })
        assert result["success"] is True
        df = result["decision_factors"]
        assert df["health_context"]["is_post_workout"] is True

    @pytest.mark.asyncio
    async def test_process_with_weather_context_overrides(self):
        """前端 weather_context 中的温度应覆盖默认值"""
        result = await self.agent.process({
            "restaurants": self._sample_restaurants(),
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "weather_context": {
                "temperature": 35, "is_raining": False, "is_heavy_rain": False
            },
            "top_k": 2
        })
        assert result["success"] is True
        df = result["decision_factors"]
        # 前端温度被注入
        assert df["frontend_weather"]["temperature"] == 35
        assert df["environment"]["weather"]["temperature"] == 35

    @pytest.mark.asyncio
    async def test_process_with_heavy_rain_marks_bad_weather(self):
        result = await self.agent.process({
            "restaurants": self._sample_restaurants(),
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "weather_context": {"is_heavy_rain": True, "temperature": 16},
            "top_k": 2
        })
        assert result["success"] is True
        assert result["decision_factors"]["is_bad_weather"] is True

    @pytest.mark.asyncio
    async def test_process_with_collaborative_scores_injected(self):
        result = await self.agent.process({
            "restaurants": self._sample_restaurants(),
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "collaborative_analysis": {
                "collaborative_scores": {"r1": 0.85, "r2": 0.7, "r3": 0.5},
                "cf_weight": 0.3,
                "num_scored": 3,
                "encoder_mode": "online",
                "ncf_mode": "online"
            },
            "top_k": 2
        })
        assert result["success"] is True
        df = result["decision_factors"]
        assert df["collaborative_scores"]["r1"] == 0.85
        assert df["cf_weight"] == 0.3

    @pytest.mark.asyncio
    async def test_process_with_edge_constraints_filters_forbidden(self):
        """端云协同硬过滤：屏蔽含敏感成分的餐厅"""
        result = await self.agent.process({
            "restaurants": [
                {"id": "r1", "name": "海鲜火锅", "cuisine_type": "海鲜",
                 "rating": 4.5, "distance": 800},
                {"id": "r2", "name": "蔬菜面馆", "cuisine_type": "面食",
                 "rating": 4.2, "distance": 1000},
            ],
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "health_context": {
                "edge_constraints": {
                    "forbidden_ingredients": ["海鲜"],
                    "required_temperature": []
                }
            },
            "top_k": 5
        })
        assert result["success"] is True
        names = [r["name"] for r in result["recommendations"]]
        # 海鲜火锅应被拦截
        assert "海鲜火锅" not in names
        assert "蔬菜面馆" in names

    @pytest.mark.asyncio
    async def test_process_with_user_allergies_filters(self):
        """用户忌口（花生过敏）应屏蔽含花生关键词的餐厅"""
        result = await self.agent.process({
            "restaurants": [
                {"id": "r1", "name": "花生酱拌面", "cuisine_type": "面食",
                 "rating": 4.5, "distance": 500},
                {"id": "r2", "name": "白米饭店", "cuisine_type": "中餐",
                 "rating": 4.2, "distance": 800},
            ],
            "context_analysis": self._sample_context_analysis(),
            "profile_analysis": self._sample_profile_analysis(),
            "health_context": {"allergies": ["花生过敏"]},
            "top_k": 5
        })
        assert result["success"] is True
        names = [r["name"] for r in result["recommendations"]]
        assert "花生酱拌面" not in names

    # ---------- generate_ai_reasons ----------
    @pytest.mark.asyncio
    async def test_generate_ai_reasons_attaches_to_recs(self):
        recs = [
            {"name": "店1", "features": {"cuisine": "火锅", "rating": 4.5,
                                         "distance": 800, "delivery_time": 25,
                                         "price": 60}, "reason": ""},
            {"name": "店2", "features": {"cuisine": "粤菜", "rating": 4.3,
                                         "distance": 1200, "delivery_time": 28,
                                         "price": 50}, "reason": ""},
            {"name": "店3", "features": {"cuisine": "轻食", "rating": 4.2,
                                         "distance": 600, "delivery_time": 18,
                                         "price": 40}, "reason": ""},
        ]
        ctx = {
            "environment": {
                "weather": {"temperature": 12, "condition": "晴", "humidity": 50},
                "temporal": {"hour": 12, "meal_period": "lunch"},
                "traffic": {"congestion_level": "畅通", "congestion_index": 1.0}
            },
            "preferred_cuisines": ["火锅"],
            "user_segment": "standard",
            "max_price": 100
        }
        out = await self.agent.generate_ai_reasons(recs, ctx)
        assert len(out) == 3
        # 至少前一条理由被替换为 AI 内容
        assert out[0]["reason"]
        # 验证 LLM 被调用
        assert self.mock_llm.chat.completions.create.called

    @pytest.mark.asyncio
    async def test_generate_ai_reasons_no_client_returns_unchanged(self):
        from app.agents.decision_agent import DecisionAgent
        # 用 None 不行（默认会建 AsyncOpenAI），但传 falsy MagicMock 也不行
        # 直接把 llm_client 设为 None
        agent = DecisionAgent(strategy="contextual", llm_client=MagicMock())
        agent.llm_client = None
        recs = [{"name": "店", "features": {}, "reason": "原理由"}]
        out = await agent.generate_ai_reasons(recs, {})
        assert out == recs

    @pytest.mark.asyncio
    async def test_generate_ai_reasons_empty_recs_returns_unchanged(self):
        out = await self.agent.generate_ai_reasons([], {})
        assert out == []

    @pytest.mark.asyncio
    async def test_generate_ai_reasons_llm_exception_falls_back(self):
        """LLM 抛错时应降级返回原 recommendations"""
        self.mock_llm.chat.completions.create = AsyncMock(
            side_effect=Exception("API 限流")
        )
        recs = [{"name": "店", "features": {"cuisine": "川菜", "rating": 4.3,
                                             "distance": 1000, "delivery_time": 25,
                                             "price": 40}, "reason": "原"}]
        out = await self.agent.generate_ai_reasons(recs, {})
        # 异常被吞，返回原列表
        assert out == recs

    # ---------- _generate_reasoning ----------
    @pytest.mark.asyncio
    async def test_generate_reasoning_empty_recs(self):
        text = await self.agent._generate_reasoning([], {}, {}, "查询")
        assert "暂无" in text

    @pytest.mark.asyncio
    async def test_generate_reasoning_cold_weather_explains_hot_food(self):
        recs = [{
            "name": "麻辣火锅", "score": 92.5,
            "features": {"distance": 800, "rating": 4.7},
            "restaurant_id": "r1"
        }]
        ctx_analysis = {
            "weather": {"temperature": 5, "condition": "晴", "is_bad_weather": False},
            "traffic": {"congestion_level": "畅通", "congestion_index": 1.0},
            "temporal": {"meal_period": "dinner", "hour": 19, "is_weekend": False}
        }
        prof_analysis = {
            "profile": {"user_segment": "standard"},
            "intent_analysis": {"detected_keywords": [{"value": "暖和"}]}
        }
        text = await self.agent._generate_reasoning(recs, ctx_analysis, prof_analysis, "想吃暖和的")
        # 应包含智能推荐头 + 温度提示
        assert "智能推荐" in text
        assert "5°C" in text or "热食" in text
        # 首选餐厅说明
        assert "麻辣火锅" in text

    @pytest.mark.asyncio
    async def test_generate_reasoning_with_health_post_workout(self):
        recs = [{"name": "轻食", "score": 88,
                  "features": {"distance": 600, "rating": 4.5},
                  "restaurant_id": "r1"}]
        ctx_analysis = {
            "weather": {"temperature": 20, "condition": "晴"},
            "traffic": {"congestion_index": 1.0},
            "temporal": {"meal_period": "lunch", "hour": 13, "is_weekend": True},
            "health_context": {
                "is_post_workout": True, "daily_steps": 11000,
                "pressure_value": 75, "pressure_level": "偏高",
                "last_sleep_duration_hours": 5.5, "sleep_quality": "较差",
                "blood_oxygen": 94, "blood_oxygen_status": "偏低",
                "overall_health_status": "需关注"
            }
        }
        prof_analysis = {"profile": {"user_segment": "premium",
                                       "cuisine_order_frequency": {"轻食": 8, "日料": 3},
                                       "browse_interest": {"健康餐": 5}}}
        text = await self.agent._generate_reasoning(recs, ctx_analysis, prof_analysis, "")
        # 健康提示应被触发
        assert "运动" in text or "蛋白质" in text
        # 高压
        assert "压力" in text or "舒缓" in text
        # 睡眠
        assert "睡眠" in text
        # 血氧
        assert "血氧" in text
        # premium 用户分群说明
        assert "品质" in text or "premium" in text.lower()

    # ---------- _make_decision_handler / _update_reward_handler ----------
    @pytest.mark.asyncio
    async def test_make_decision_handler_returns_recommendations(self):
        recs = await self.agent._make_decision_handler(
            restaurants=self._sample_restaurants(),
            context={"max_distance": 20000, "max_price": 100, "min_price": 0,
                      "preferred_cuisines": ["火锅"]},
            top_k=2
        )
        assert isinstance(recs, list)
        assert len(recs) == 2
        assert recs[0]["rank"] == 1

    @pytest.mark.asyncio
    async def test_update_reward_handler_existing(self):
        from app.agents.decision_agent import RestaurantArm
        self.agent._arms_history["r1"] = RestaurantArm(
            restaurant_id="r1", name="店", pulls=2, rewards=1.0
        )
        result = await self.agent._update_reward_handler("r1", 0.8)
        assert result["success"] is True
        assert result["restaurant_id"] == "r1"
        assert "new_average_reward" in result

    @pytest.mark.asyncio
    async def test_update_reward_handler_unknown(self):
        result = await self.agent._update_reward_handler("nonexistent", 0.5)
        assert result["success"] is False
        assert "not found" in result["error"]
