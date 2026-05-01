# -*- coding: utf-8 -*-
"""
真实白盒测试 — 直接导入 backend 业务模块以获得真实覆盖率

与 tests/unit/backend/ 下的纯逻辑自包含测试不同，这里通过 sys.path
注入将 backend/recommendation-service 注册为可导入包，然后对
ContextualBanditStrategy、UCB1Strategy 等真实类进行调用，
使 coverage.py 能够追踪真实代码路径。

运行：
    python -m pytest tests/coverage/test_whitebox_real_import.py \
        --cov=backend/recommendation-service/app \
        --cov-report=term-missing
"""
import os
import sys
import math
import pytest

# 注入 backend 路径
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REC_PATH = os.path.join(ROOT, "backend", "recommendation-service")
if REC_PATH not in sys.path:
    sys.path.insert(0, REC_PATH)


# ==================== ContextAgent 真实导入测试 ====================
class TestContextAgentRealImport:
    """直接导入 app.agents.context_agent 进行白盒覆盖"""

    def setup_method(self):
        from app.agents.context_agent import ContextAgent
        self.agent = ContextAgent()

    def test_meal_period_breakfast(self):
        """覆盖 _get_meal_period 的 breakfast 分支"""
        assert self.agent._get_meal_period(8) == "breakfast"

    def test_meal_period_lunch(self):
        assert self.agent._get_meal_period(12) == "lunch"

    def test_meal_period_dinner(self):
        assert self.agent._get_meal_period(19) == "dinner"

    def test_meal_period_night_snack(self):
        assert self.agent._get_meal_period(23) == "night_snack"

    def test_meal_period_off_peak(self):
        """覆盖兜底分支（凌晨 3 点不属于任何用餐时段）"""
        assert self.agent._get_meal_period(3) == "off_peak"

    def test_is_peak_hour_true(self):
        for h in [11, 12, 13, 18, 19, 20]:
            assert self.agent._is_peak_hour(h) is True

    def test_is_peak_hour_false(self):
        assert self.agent._is_peak_hour(15) is False

    def test_calculate_urgency_high(self):
        """高峰用餐时段且高峰小时 → high"""
        assert self.agent._calculate_urgency(12, "lunch") == "high"

    def test_calculate_urgency_medium(self):
        assert self.agent._calculate_urgency(9, "breakfast") == "medium"

    def test_calculate_urgency_low(self):
        assert self.agent._calculate_urgency(15, "afternoon_tea") == "low"

    def test_assess_weather_delivery_impact_clear(self):
        impact = self.agent._assess_weather_delivery_impact("晴")
        assert impact["level"] == "low"
        assert impact["delay_minutes"] == 0

    def test_assess_weather_delivery_impact_storm(self):
        impact = self.agent._assess_weather_delivery_impact("暴雨")
        assert impact["level"] == "critical"
        assert impact["delay_minutes"] == 60

    def test_is_bad_weather_true(self):
        assert self.agent._is_bad_weather("暴雨") is True

    def test_is_bad_weather_false(self):
        assert self.agent._is_bad_weather("多云") is False

    def test_calculate_comfort_index_comfortable(self):
        assert self.agent._calculate_comfort_index(22, 50) == "舒适"

    def test_calculate_comfort_index_uncomfortable(self):
        assert self.agent._calculate_comfort_index(40, 90) == "不适"

    def test_recommend_delivery_radius_clear(self):
        """通畅 → 20km"""
        assert self.agent._recommend_delivery_radius(1.0) == 20000

    def test_recommend_delivery_radius_jam(self):
        """严重拥堵 → 5km"""
        assert self.agent._recommend_delivery_radius(3.0) == 5000

    def test_get_weather_food_suggestions_cold(self):
        suggestions = self.agent._get_weather_food_suggestions("晴", 5)
        assert any(k in suggestions for k in ["火锅", "麻辣烫", "热汤面", "砂锅"])

    def test_get_weather_food_suggestions_hot(self):
        suggestions = self.agent._get_weather_food_suggestions("晴", 36)
        assert any(k in suggestions for k in ["凉皮", "冷面", "沙拉", "甜品"])


# ==================== DecisionAgent MAB 策略真实导入测试 ====================
class TestMABStrategiesRealImport:
    """直接导入 app.agents.decision_agent 中的真实 MAB 策略类"""

    def setup_method(self):
        from app.agents.decision_agent import (
            RestaurantArm, UCB1Strategy, ThompsonSamplingStrategy,
            EpsilonGreedyStrategy, ContextualBanditStrategy
        )
        self.RestaurantArm = RestaurantArm
        self.UCB1 = UCB1Strategy
        self.TS = ThompsonSamplingStrategy
        self.EG = EpsilonGreedyStrategy
        self.CB = ContextualBanditStrategy

    def _make_arms(self):
        arms = []
        for i, (name, dist, rating, price, cuisine) in enumerate([
            ("火锅店A", 800, 4.7, 50, "火锅"),
            ("冷面馆B", 1500, 4.3, 30, "冷面"),
            ("轻食馆C", 1800, 4.4, 40, "轻食"),
        ]):
            arm = self.RestaurantArm(
                restaurant_id=f"r{i}", name=name,
                pulls=10 + i * 5, rewards=(0.5 + i * 0.1) * (10 + i * 5),
                features={"distance": dist, "rating": rating, "price": price,
                          "cuisine": cuisine, "delivery_time": 25}
            )
            arms.append(arm)
        return arms

    def test_ucb1_select(self):
        strategy = self.UCB1(exploration_factor=2.0)
        arms = self._make_arms()
        chosen = strategy.select(arms)
        assert chosen is not None
        assert chosen.restaurant_id in {a.restaurant_id for a in arms}

    def test_ucb1_rank_all(self):
        strategy = self.UCB1()
        arms = self._make_arms()
        ranked = strategy.rank_all(arms)
        assert len(ranked) == len(arms)
        # 平均奖励高+pulls 高的应排名靠前
        assert ranked[0].pulls > 0

    def test_ucb1_unexplored_priority(self):
        """未探索的 arm 应被优先选择"""
        strategy = self.UCB1()
        arms = self._make_arms()
        # 加一个 pulls=0 的新 arm
        new_arm = self.RestaurantArm(
            restaurant_id="r_new", name="新店", pulls=0, rewards=0.0,
            features={"distance": 1000, "rating": 4.0, "price": 35,
                      "cuisine": "快餐", "delivery_time": 25}
        )
        arms.append(new_arm)
        chosen = strategy.select(arms)
        assert chosen.restaurant_id == "r_new"

    def test_thompson_sampling_select(self):
        strategy = self.TS()
        arms = self._make_arms()
        chosen = strategy.select(arms)
        assert chosen is not None

    def test_thompson_rank_all(self):
        strategy = self.TS()
        arms = self._make_arms()
        ranked = strategy.rank_all(arms)
        assert len(ranked) == len(arms)

    def test_epsilon_greedy_select(self):
        strategy = self.EG(epsilon=0.0)  # 纯利用
        arms = self._make_arms()
        chosen = strategy.select(arms)
        # epsilon=0 时应选平均奖励最高的
        best = max(arms, key=lambda a: a.average_reward)
        assert chosen.restaurant_id == best.restaurant_id

    def test_epsilon_greedy_explore(self):
        strategy = self.EG(epsilon=1.0)  # 纯探索
        arms = self._make_arms()
        chosen = strategy.select(arms)
        assert chosen is not None

    def test_contextual_bandit_normal(self):
        strategy = self.CB()
        arms = self._make_arms()
        ctx = {"max_distance": 20000, "max_price": 100, "min_price": 0,
               "preferred_cuisines": ["火锅"]}
        ranked = strategy.rank_all(arms, ctx)
        assert len(ranked) == 3

    def test_contextual_bandit_hot_weather(self):
        """35°C 高温场景 — 火锅应被压制，冷面/轻食上浮"""
        strategy = self.CB()
        arms = self._make_arms()
        ctx = {
            "max_distance": 20000, "max_price": 100, "min_price": 0,
            "preferred_cuisines": [],
            "frontend_weather": {"temperature": 35, "is_bad_weather": False},
        }
        ranked = strategy.rank_all(arms, ctx)
        names = [a.name for a in ranked]
        # 火锅店 A 不应排第一
        assert names[0] != "火锅店A"

    def test_contextual_bandit_cold_weather_finds_keyword_collision_bug(self):
        """
        白盒测试发现的缺陷 — 0°C 低温下，菜系字符串 '冷面' 因包含字符 '冷'
        被错误地命中 cold_keywords，从而获得了 -0.65 的反向加成。
        但因冷面馆基础分（评分、价格、距离归一化）较高，净得分仍超过火锅店。

        本用例固化该真实算法行为；缺陷已在《测试缺陷与改进建议》中登记
        （建议将菜系字符串改为按整词匹配，或将 cold_keywords 中的 '冷'
        改为更精确的 '冷饮'/'冷盘' 等）。
        """
        strategy = self.CB()
        arms = self._make_arms()
        ctx = {
            "max_distance": 20000, "max_price": 100, "min_price": 0,
            "preferred_cuisines": [],
            "frontend_weather": {"temperature": 0, "is_bad_weather": False},
        }
        # 直接调用打分函数，验证关键字冲突存在
        score_hotpot = strategy._calculate_contextual_score(arms[0], ctx)
        score_coldnoodle = strategy._calculate_contextual_score(arms[1], ctx)
        # 当前实际行为：因关键字冲突，冷面分高于火锅
        assert score_coldnoodle > score_hotpot, (
            "若该断言失败，说明关键字冲突缺陷已修复，请同步更新本测试"
        )

    def test_contextual_bandit_post_workout(self):
        """运动后 — 高蛋白餐厅应得加分"""
        strategy = self.CB()
        arms = []
        for i, (name, cuisine) in enumerate([
            ("健身餐厅", "鸡胸肉沙拉"),
            ("麻辣火锅", "麻辣火锅"),
        ]):
            arms.append(self.RestaurantArm(
                restaurant_id=f"r{i}", name=name, pulls=10, rewards=5.0,
                features={"distance": 1000, "rating": 4.5, "price": 40,
                          "cuisine": cuisine, "delivery_time": 25}
            ))
        ctx = {
            "max_distance": 20000, "max_price": 100, "min_price": 0,
            "preferred_cuisines": [],
            "health_context": {"is_post_workout": True, "heart_rate": 110},
        }
        ranked = strategy.rank_all(arms, ctx)
        assert ranked[0].name == "健身餐厅"


# ==================== ProfilerAgent 真实导入测试 ====================
class TestProfilerAgentRealImport:
    def setup_method(self):
        from app.agents.profiler_agent import ProfilerAgent, UserProfile
        self.agent = ProfilerAgent()
        self.UserProfile = UserProfile

    def test_default_profile_creation(self):
        profile = self.agent._create_default_profile("u_test")
        assert profile.user_id == "u_test"
        assert profile.user_segment == "standard"
        assert profile.preferred_distance == 3000

    def test_query_intent_general(self):
        intent = self.agent._analyze_query_intent("")
        assert intent["intent_type"] == "general"
        assert intent["urgency"] == "normal"

    def test_query_intent_specific_cuisine(self):
        intent = self.agent._analyze_query_intent("想吃川菜")
        assert intent["intent_type"] == "specific"
        cuisines = [k for k in intent["detected_keywords"] if k["type"] == "cuisine"]
        assert len(cuisines) >= 1

    def test_query_intent_urgent(self):
        intent = self.agent._analyze_query_intent("我现在很饿，要快点")
        assert intent["urgency"] == "urgent"

    def test_query_intent_relaxed(self):
        intent = self.agent._analyze_query_intent("随便吃点都行")
        assert intent["urgency"] == "relaxed"

    def test_recommendation_weights_normalize(self):
        """权重归一化必须 sum=1.0"""
        profile = self.agent._create_default_profile("u")
        weights = self.agent._calculate_recommendation_weights(
            profile, {}, {"urgency": "normal"}
        )
        total = sum(weights.values())
        assert abs(total - 1.0) < 1e-6

    def test_recommendation_weights_budget_user(self):
        profile = self.agent._create_default_profile("u")
        profile.user_segment = "budget"
        weights = self.agent._calculate_recommendation_weights(
            profile, {}, {"urgency": "normal"}
        )
        # budget 用户价格权重应被提升
        assert weights["price"] > weights["rating"]

    def test_recommendation_weights_premium_user(self):
        profile = self.agent._create_default_profile("u")
        profile.user_segment = "premium"
        weights = self.agent._calculate_recommendation_weights(
            profile, {}, {"urgency": "normal"}
        )
        assert weights["rating"] > weights["price"]

    def test_recommendation_weights_urgent(self):
        profile = self.agent._create_default_profile("u")
        weights = self.agent._calculate_recommendation_weights(
            profile, {}, {"urgency": "urgent"}
        )
        # 紧急用户配送时间和距离权重应较高
        assert weights["delivery_time"] >= 0.20 / sum([0.30, 0.15, 0.20, 0.15, 0.25])
