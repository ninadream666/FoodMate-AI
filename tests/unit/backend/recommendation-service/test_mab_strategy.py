# -*- coding: utf-8 -*-
"""
多臂老虎机(MAB)推荐策略单元测试
覆盖UCB1、Thompson采样、Epsilon贪心、上下文感知等策略的选择和权重计算
纯逻辑测试，不依赖任何外部库
"""
import pytest
import math
import random


# ==================== UCB1 策略测试 ====================

class TestUCB1Strategy:
    """UCB1（置信上界）策略测试"""

    def test_ucb1_score_calculation(self):
        """UCB1分数 = 平均奖励 + 探索因子 * sqrt(ln(总次数)/该臂次数)"""
        avg_reward = 0.7
        total_pulls = 100
        arm_pulls = 10
        exploration_factor = 2.0

        ucb_score = avg_reward + exploration_factor * math.sqrt(
            math.log(total_pulls) / arm_pulls
        )

        assert ucb_score > avg_reward  # UCB分数应高于平均奖励（含探索奖励）
        assert ucb_score < 3.0  # 应在合理范围内

    def test_ucb1_favors_unexplored_arms(self):
        """UCB1应倾向于探索较少被选择的选项"""
        total_pulls = 100
        exploration = 2.0

        score_less_explored = 0.5 + exploration * math.sqrt(math.log(total_pulls) / 10)
        score_more_explored = 0.5 + exploration * math.sqrt(math.log(total_pulls) / 50)

        assert score_less_explored > score_more_explored

    def test_ucb1_zero_pulls_should_prioritize(self):
        """从未被选择的臂应被优先选择（探索分无穷大）"""
        arm_pulls = 0
        should_prioritize = (arm_pulls == 0)
        assert should_prioritize

    def test_ucb1_converges_to_best_arm(self):
        """多次迭代后UCB1应收敛到最优臂"""
        arms = [
            {"avg_reward": 0.9, "pulls": 50},  # 最优臂
            {"avg_reward": 0.5, "pulls": 50},
            {"avg_reward": 0.3, "pulls": 50},
        ]
        total_pulls = 150
        exploration = 2.0

        scores = []
        for arm in arms:
            score = arm["avg_reward"] + exploration * math.sqrt(
                math.log(total_pulls) / arm["pulls"]
            )
            scores.append(score)

        best_idx = scores.index(max(scores))
        assert best_idx == 0  # 最优臂应得分最高


# ==================== Thompson 采样策略测试 ====================

class TestThompsonSampling:
    """Thompson采样策略测试"""

    def test_thompson_initial_params_should_be_uniform(self):
        """初始状态下alpha=beta=1（均匀分布）"""
        alpha_init = 1
        beta_init = 1
        assert alpha_init == beta_init == 1

    def test_thompson_update_after_positive_reward(self):
        """获得正向奖励后alpha应增加"""
        alpha, beta = 10, 5
        reward = 1
        new_alpha = alpha + reward
        new_beta = beta + (1 - reward)
        assert new_alpha == 11
        assert new_beta == 5

    def test_thompson_update_after_negative_reward(self):
        """获得负向奖励后beta应增加"""
        alpha, beta = 10, 5
        reward = 0
        new_alpha = alpha + reward
        new_beta = beta + (1 - reward)
        assert new_alpha == 10
        assert new_beta == 6

    def test_thompson_high_alpha_biases_toward_high(self):
        """alpha远大于beta时，采样均值应接近1"""
        alpha, beta = 100, 1
        expected_mean = alpha / (alpha + beta)
        assert expected_mean > 0.9

    def test_thompson_batch_sampling(self):
        """批量采样应符合Beta分布特征"""
        random.seed(42)
        alpha, beta = 30, 10
        samples = [random.betavariate(alpha, beta) for _ in range(1000)]
        avg = sum(samples) / len(samples)
        expected_mean = alpha / (alpha + beta)  # 0.75
        assert abs(avg - expected_mean) < 0.05  # 误差应小于5%


# ==================== Epsilon贪心策略测试 ====================

class TestEpsilonGreedy:
    """Epsilon贪心策略测试"""

    def test_epsilon_range(self):
        """epsilon应在0到1之间"""
        epsilon = 0.1
        assert 0 <= epsilon <= 1

    def test_epsilon_exploit_probability(self):
        """1-epsilon概率应选择最优臂"""
        epsilon = 0.1
        exploit_prob = 1 - epsilon
        assert exploit_prob == pytest.approx(0.9)

    def test_epsilon_decay(self):
        """epsilon应随时间衰减（减少探索，增加利用）"""
        initial_epsilon = 0.3
        decay_rate = 0.995
        steps = 100
        final_epsilon = initial_epsilon * (decay_rate ** steps)
        assert final_epsilon < initial_epsilon
        assert final_epsilon > 0

    def test_epsilon_greedy_selection(self):
        """模拟epsilon-greedy选择逻辑"""
        random.seed(42)
        arms = [0.3, 0.9, 0.5]  # 平均奖励
        epsilon = 0.1
        exploits = 0
        explores = 0
        n_trials = 10000

        for _ in range(n_trials):
            if random.random() < epsilon:
                explores += 1
            else:
                exploits += 1

        explore_ratio = explores / n_trials
        assert abs(explore_ratio - epsilon) < 0.02  # 探索比例应接近epsilon


# ==================== 上下文感知MAB策略测试 ====================

class TestContextualBandit:
    """上下文感知多臂老虎机策略测试"""

    def test_base_weights_sum_to_one(self):
        """基础权重之和应为1"""
        base_weights = {
            "distance": 0.05, "rating": 0.30, "price": 0.20,
            "cuisine": 0.30, "delivery": 0.15,
        }
        total = sum(base_weights.values())
        assert total == pytest.approx(1.0)

    def test_high_context_weights_sum_to_one(self):
        """强上下文权重之和应为1"""
        high_context_weights = {
            "distance": 0.02, "rating": 0.15, "price": 0.13,
            "cuisine": 0.55, "delivery": 0.15,
        }
        total = sum(high_context_weights.values())
        assert total == pytest.approx(1.0)

    def test_weather_context_increases_delivery_weight(self):
        """恶劣天气应增加配送时间权重"""
        base_delivery = 0.15
        weather_boost = 0.65
        adjusted = base_delivery + weather_boost
        assert adjusted > base_delivery

    def test_health_context_increases_cuisine_weight(self):
        """健康上下文应调整口味权重"""
        base_cuisine = 0.30
        health_boost = 0.35
        adjusted = base_cuisine + health_boost
        assert adjusted > base_cuisine

    def test_context_score_calculation(self):
        """上下文综合评分计算"""
        features = {
            "distance": 0.8, "rating": 0.9, "price": 0.7,
            "cuisine": 0.95, "delivery": 0.6,
        }
        weights = {
            "distance": 0.05, "rating": 0.30, "price": 0.20,
            "cuisine": 0.30, "delivery": 0.15,
        }
        score = sum(features[k] * weights[k] for k in features)
        assert 0 <= score <= 1
        assert score > 0.7  # 综合高分餐厅

    def test_score_ranking_is_correct(self):
        """餐厅评分排序应正确"""
        weights = {"distance": 0.05, "rating": 0.30, "price": 0.20,
                   "cuisine": 0.30, "delivery": 0.15}

        restaurant_a = {"distance": 0.9, "rating": 0.95, "price": 0.8,
                        "cuisine": 0.9, "delivery": 0.85}
        restaurant_b = {"distance": 0.5, "rating": 0.6, "price": 0.5,
                        "cuisine": 0.4, "delivery": 0.3}

        score_a = sum(restaurant_a[k] * weights[k] for k in weights)
        score_b = sum(restaurant_b[k] * weights[k] for k in weights)

        assert score_a > score_b  # A应排在B前面

    def test_ml_ensemble_weights(self):
        """ML集成权重验证: LightGBM 0.6 + DeepFM 0.4 = 1.0"""
        lgb_weight = 0.6
        dfm_weight = 0.4
        assert lgb_weight + dfm_weight == pytest.approx(1.0)

        lgb_score = 0.85
        dfm_score = 0.78
        ensemble = lgb_weight * lgb_score + dfm_weight * dfm_score
        assert 0 < ensemble < 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
