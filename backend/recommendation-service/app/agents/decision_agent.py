"""
DecisionAgent - 决策智能体

职责:
- 整合上下文和用户画像信息
- 使用 MAB (Multi-Armed Bandit) 算法进行决策
- 输出最终的餐厅推荐排序

能力:
- 多臂老虎机算法 (UCB1, Thompson Sampling, ε-Greedy)
- 智能排序和决策
- 推荐理由生成
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import logging
import random
import math
import os

from openai import AsyncOpenAI
from .base_agent import BaseAgent, Tool, global_tool_registry

# ML Ensemble 策略（LightGBM + DeepFM）
try:
    from ..ml.ensemble_strategy import EnsembleMLStrategy
    from ..ml.data_collector import get_collector as get_data_collector
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class RestaurantArm:
    """餐厅臂（MAB中的arm）"""
    restaurant_id: str
    name: str
    pulls: int = 0  # 被选择次数
    rewards: float = 0.0  # 累积奖励
    features: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def average_reward(self) -> float:
        """平均奖励"""
        return self.rewards / self.pulls if self.pulls > 0 else 0.0


class MABStrategy:
    """MAB 策略基类"""
    
    def select(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> RestaurantArm:
        raise NotImplementedError


class UCB1Strategy(MABStrategy):
    """UCB1 (Upper Confidence Bound) 策略"""
    
    def __init__(self, exploration_factor: float = 2.0):
        self.exploration_factor = exploration_factor
        
    def select(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> RestaurantArm:
        if not arms:
            return None
            
        total_pulls = sum(arm.pulls for arm in arms)
        
        # 优先选择未被探索的臂
        unexplored = [arm for arm in arms if arm.pulls == 0]
        if unexplored:
            return random.choice(unexplored)
        
        # 计算UCB值
        def ucb_value(arm: RestaurantArm) -> float:
            exploitation = arm.average_reward
            exploration = math.sqrt(self.exploration_factor * math.log(total_pulls) / arm.pulls)
            return exploitation + exploration
        
        return max(arms, key=ucb_value)
    
    def rank_all(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> List[RestaurantArm]:
        """对所有臂进行排序"""
        if not arms:
            return []
        
        total_pulls = sum(arm.pulls for arm in arms) or 1
        
        def ucb_value(arm: RestaurantArm) -> float:
            if arm.pulls == 0:
                return float('inf')  # 未探索的优先
            exploitation = arm.average_reward
            exploration = math.sqrt(self.exploration_factor * math.log(total_pulls) / arm.pulls)
            return exploitation + exploration
        
        return sorted(arms, key=ucb_value, reverse=True)


class ThompsonSamplingStrategy(MABStrategy):
    """Thompson Sampling 策略（贝叶斯方法）"""
    
    def select(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> RestaurantArm:
        if not arms:
            return None
        
        # 使用 Beta 分布采样
        def sample_beta(arm: RestaurantArm) -> float:
            alpha = arm.rewards + 1  # 成功次数 + 1
            beta = max(arm.pulls - arm.rewards, 0) + 1  # 失败次数 + 1
            return random.betavariate(alpha, beta)
        
        return max(arms, key=sample_beta)
    
    def rank_all(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> List[RestaurantArm]:
        """对所有臂进行排序"""
        if not arms:
            return []
        
        def sample_beta(arm: RestaurantArm) -> float:
            alpha = arm.rewards + 1
            beta = max(arm.pulls - arm.rewards, 0) + 1
            return random.betavariate(alpha, beta)
        
        # 多次采样取平均，减少随机性
        scores = {}
        for arm in arms:
            samples = [sample_beta(arm) for _ in range(10)]
            scores[arm.restaurant_id] = sum(samples) / len(samples)
        
        return sorted(arms, key=lambda a: scores[a.restaurant_id], reverse=True)


class EpsilonGreedyStrategy(MABStrategy):
    """ε-Greedy 策略"""
    
    def __init__(self, epsilon: float = 0.1):
        self.epsilon = epsilon
        
    def select(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> RestaurantArm:
        if not arms:
            return None
            
        # 以 epsilon 概率探索，1-epsilon 概率利用
        if random.random() < self.epsilon:
            return random.choice(arms)
        else:
            return max(arms, key=lambda a: a.average_reward)
    
    def rank_all(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> List[RestaurantArm]:
        """对所有臂进行排序"""
        if not arms:
            return []
        
        # 基于平均奖励排序，但加入一些随机性
        ranked = sorted(arms, key=lambda a: a.average_reward + random.uniform(0, 0.1 * self.epsilon), reverse=True)
        return ranked


class ContextualBanditStrategy(MABStrategy):
    """上下文感知 MAB 策略"""
    
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or {
            "distance": 0.25,
            "rating": 0.25,
            "price": 0.20,
            "cuisine_match": 0.20,
            "delivery_time": 0.10
        }
        
    def select(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> RestaurantArm:
        if not arms:
            return None
        
        scores = [(arm, self._calculate_contextual_score(arm, context)) for arm in arms]
        return max(scores, key=lambda x: x[1])[0]
    
    def rank_all(self, arms: List[RestaurantArm], context: Dict[str, Any] = None) -> List[RestaurantArm]:
        """对所有臂进行排序"""
        if not arms:
            return []
        
        scores = [(arm, self._calculate_contextual_score(arm, context)) for arm in arms]
        sorted_pairs = sorted(scores, key=lambda x: x[1], reverse=True)
        return [pair[0] for pair in sorted_pairs]
    
    def _calculate_contextual_score(self, arm: RestaurantArm, context: Dict[str, Any] = None) -> float:
        """计算上下文感知得分（0-1.0范围，乘以100后为60-100分）"""
        features = arm.features
        context = context or {}

        # 基础分 0.35（降低基础分，给可变分更多空间拉开差距）
        base_score = 0.35
        variable_score = 0.0

        # ========== 动态权重：根据天气/健康状态调整各因素权重 ==========
        # 默认权重（距离权重最低，优先按评分和菜系匹配推荐）
        w_distance = 0.05
        w_rating = 0.30
        w_price = 0.20
        w_cuisine = 0.30
        w_delivery = 0.15

        # 检测是否存在强上下文信号（极端天气或特殊健康状态）
        env = context.get("environment", {})
        weather_ctx = env.get("weather", {})
        frontend_weather = context.get("frontend_weather", {})
        health_ctx_pre = context.get("health_context", {})

        temperature_pre = frontend_weather.get("temperature") or weather_ctx.get("temperature", 20)
        is_bad_weather_pre = context.get("is_bad_weather", False) or frontend_weather.get("is_bad_weather", False) or weather_ctx.get("is_bad_weather", False)
        is_post_workout_pre = health_ctx_pre.get("is_post_workout", False)
        overall_health_pre = health_ctx_pre.get("overall_health_status", "无数据")
        pressure_pre = health_ctx_pre.get("pressure_value", 50)
        sleep_pre = health_ctx_pre.get("last_sleep_duration_hours", 0)

        has_strong_context = (
            (temperature_pre is not None and (temperature_pre >= 30 or temperature_pre <= 10))
            or is_bad_weather_pre
            or is_post_workout_pre
            or overall_health_pre == "需关注"
            or pressure_pre >= 70
            or (0 < sleep_pre < 6)
        )

        if has_strong_context:
            # 强上下文信号：距离权重降到最低，菜系匹配成为主导因素
            w_distance = 0.02
            w_rating = 0.18
            w_price = 0.10
            w_cuisine = 0.55
            w_delivery = 0.15

        # 距离得分（距离越近越好）
        distance = features.get("distance", 1500)
        if distance <= 0:
            distance = 1000
        max_distance = context.get("max_distance", 20000)
        distance_score = max(0.0, 1 - distance / max_distance)
        variable_score += w_distance * distance_score

        # 评分得分
        rating = features.get("rating", 4.0)
        if rating <= 0:
            rating = 4.0
        rating_score = max(0.0, min(1.0, (rating - 3.0) / 2.0))
        variable_score += w_rating * rating_score

        # 价格匹配得分
        price = features.get("price", 35)
        if price <= 0:
            price = 35
        user_max_price = context.get("max_price", 100)
        user_min_price = context.get("min_price", 0)
        if user_min_price <= price <= user_max_price:
            price_score = 1.0
        elif price < user_min_price:
            price_score = 0.5
        else:
            price_score = max(0.0, 1 - (price - user_max_price) / 50)
        variable_score += w_price * price_score

        # 菜系匹配得分
        cuisine = features.get("cuisine", "")
        preferred_cuisines = context.get("preferred_cuisines", [])
        if preferred_cuisines and any(c in cuisine for c in preferred_cuisines):
            cuisine_score = 1.0
        else:
            cuisine_score = 0.3
        variable_score += w_cuisine * cuisine_score

        # 配送时间得分
        delivery_time = features.get("delivery_time", 25)
        if delivery_time <= 0:
            delivery_time = 25
        time_score = max(0.0, min(1.0, 1 - (delivery_time - 15) / 45))
        variable_score += w_delivery * time_score
        
        # ========== 上下文感知加成（天气/交通/运动/时段） ==========
        context_bonus = 0.0
        
        # 优先从前端传入的 weather_context 获取天气数据（后端天气API经常降级为默认值）
        env = context.get("environment", {})
        weather_ctx = env.get("weather", {})
        frontend_weather = context.get("frontend_weather", {})
        
        # is_bad_weather: 前端标记 > 当前上下文 > 天气分析结果
        is_bad_weather = context.get("is_bad_weather", False) or frontend_weather.get("is_bad_weather", False) or weather_ctx.get("is_bad_weather", False)
        
        # 温度: 优先用前端传入的真实温度，而不是后端API降级后的默认值25°C
        temperature = frontend_weather.get("temperature") or weather_ctx.get("temperature")
        if temperature is None or temperature == 25:  # 25很可能是后端降级默认值
            temperature = frontend_weather.get("temperature") or weather_ctx.get("temperature", 20)
        
        # 1. 天气影响排序（加大幅度！）
        if is_bad_weather:
            # 雨天：近距离餐厅大幅加分，远距离大幅扣分
            if distance <= 1000:
                context_bonus += 0.20
            elif distance <= 2000:
                context_bonus += 0.08
            elif distance > 3000:
                context_bonus -= 0.15
            if delivery_time <= 20:
                context_bonus += 0.10
            elif delivery_time > 35:
                context_bonus -= 0.10
        
        # 2. 温度影响排序（强上下文时大幅放大）
        is_hot_food = features.get("is_hot_food", True)
        cuisine_str = str(cuisine).lower()
        if temperature is not None:
            if temperature >= 30:
                # 高温天：清凉类大幅加分，燥热类强力压制
                cold_keywords = ["冰", "凉", "沙拉", "冷", "饮", "果汁", "甜品", "日料", "寿司", "西食", "快餐", "轻食", "酸奶", "水果"]
                hot_keywords = ["火锅", "烤", "烧烤", "烤肉", "麻辣", "串", "煲", "砂锅", "炒", "小龙虾", "铁板"]
                # 温度越高影响越大：30°C=0.45, 35°C=0.55, 40°C=0.65
                heat_factor = min(0.65, 0.45 + (temperature - 30) * 0.02)
                if any(k in cuisine_str for k in cold_keywords):
                    context_bonus += heat_factor
                elif any(k in cuisine_str for k in hot_keywords):
                    context_bonus -= heat_factor
                else:
                    context_bonus -= 0.05  # 非清凉类轻微扣分，拉开差距
            elif temperature <= 10:
                # 低温天：暖身热食大幅加分，生冷类强力压制
                hot_keywords = ["火锅", "汤", "粥", "麻辣", "烤", "煲", "砂锅", "川菜", "湘菜", "锅", "炖", "蒸"]
                cold_keywords = ["冰", "凉", "沙拉", "冷", "果汁", "甜品", "刺身"]
                # 温度越低影响越大：10°C=0.45, 5°C=0.55, 0°C=0.65
                cold_factor = min(0.65, 0.45 + (10 - temperature) * 0.02)
                if any(k in cuisine_str for k in hot_keywords):
                    context_bonus += cold_factor
                elif any(k in cuisine_str for k in cold_keywords):
                    context_bonus -= cold_factor
                else:
                    context_bonus -= 0.05  # 非热食轻微扣分
        
        # 3. 交通拥堵影响排序
        congestion_index = context.get("congestion_index", 1.0)
        if isinstance(congestion_index, str):
            try:
                congestion_index = float(congestion_index)
            except:
                congestion_index = 1.0
        if congestion_index > 1.3:
            if distance <= 1000:
                context_bonus += 0.12
            elif distance <= 2000:
                context_bonus += 0.03
            elif distance > 3000:
                context_bonus -= 0.10
        
        # 4. 高峰时段影响
        if context.get("is_peak_hour", False):
            if delivery_time <= 20:
                context_bonus += 0.08
            elif delivery_time > 35:
                context_bonus -= 0.06
        
        # ========================================================================
        # 5. 健康数据驱动推荐（基于国际营养与运动科学标准）
        #
        # 参考依据：
        # - ISSN (国际运动营养学会): 运动后 30min 内摄入 20-40g 蛋白质 + 碳水 4:1
        # - AHA (美国心脏协会): 高心率时避免高钠高脂，推荐富钾食物
        # - ACSM (美国运动医学会): 久坐人群每日热量摄入应低于活跃人群 300-500kcal
        # - WHO 健康饮食指南: 每日钠<2000mg, 糖<25g, 蔬果≥400g
        # - Harvard 营养学院: 皮质醇(压力激素)升高时 Omega-3 和镁有助调节
        # - NSF (国家睡眠基金会): 睡眠不足时避免咖啡因过量，优选色氨酸食物
        # ========================================================================
        health_ctx = context.get("health_context", {})
        heart_rate = health_ctx.get("heart_rate", 75)

        # ----- 5.1 心率分区推荐 (AHA 心率区间标准) -----
        # Zone 1: <100 静息态, Zone 2: 100-120 轻度, Zone 3: 120-140 中等
        # Zone 4: 140-160 高强度, Zone 5: >160 极限
        if health_ctx.get("is_post_workout", False):
            # ISSN: 运动后30min黄金窗口期，蛋白质+碳水4:1最佳恢复
            protein_carb_keywords = ["鸡胸", "蛋白", "牛肉", "鸡肉", "鱼", "虾", "豆腐",
                                     "日料", "寿司", "沙拉", "轻食", "健康", "粗粮",
                                     "全麦", "燕麦", "粥", "面", "米饭", "香蕉"]
            inflammatory_keywords = ["油炸", "炸鸡", "烧烤", "麻辣", "火锅", "串",
                                    "小龙虾", "薯条", "汉堡", "酒"]
            if any(k in cuisine_str for k in protein_carb_keywords):
                context_bonus += 0.35
            elif any(k in cuisine_str for k in inflammatory_keywords):
                context_bonus -= 0.30  # 高脂高炎症食物延缓肌肉恢复
            else:
                context_bonus += 0.05
        elif heart_rate > 140:
            # Zone 4-5 高强度心率: AHA建议低钠、富钾、易消化
            cardio_safe = ["粥", "汤", "蒸", "轻食", "沙拉", "面", "日料", "清淡", "蔬菜", "鱼"]
            cardio_avoid = ["火锅", "烧烤", "麻辣", "油炸", "重口味", "咖啡"]
            if any(k in cuisine_str for k in cardio_safe):
                context_bonus += 0.25
            elif any(k in cuisine_str for k in cardio_avoid):
                context_bonus -= 0.20
        elif heart_rate > 100:
            # Zone 2-3 中度心率: 偏向均衡营养
            balanced_keywords = ["粥", "汤", "面", "轻食", "沙拉", "日料", "健康"]
            if any(k in cuisine_str for k in balanced_keywords):
                context_bonus += 0.12

        # ----- 5.2 压力/皮质醇管理 (Harvard 营养学院) -----
        # 高皮质醇时 Omega-3 脂肪酸(鱼、坚果)和镁(深色蔬菜)有助调节
        # 避免高糖高咖啡因加剧皮质醇分泌
        pressure_value = health_ctx.get("pressure_value", 50)
        pressure_level = health_ctx.get("pressure_level", "正常")
        if pressure_value >= 80 or pressure_level == "偏高":
            # 重度压力: 强推 Omega-3 + 镁 + 色氨酸食物
            destress_keywords = ["鱼", "三文鱼", "日料", "寿司", "坚果", "牛油果",
                                "蔬菜", "沙拉", "粥", "汤", "蒸", "清淡", "轻食"]
            stress_amplify = ["咖啡", "麻辣", "辣", "火锅", "油炸", "酒", "甜品",
                             "奶茶", "蛋糕", "冰淇淋"]  # 高糖高咖啡因加剧皮质醇
            if any(k in cuisine_str for k in destress_keywords):
                context_bonus += 0.25
            elif any(k in cuisine_str for k in stress_amplify):
                context_bonus -= 0.18
        elif pressure_value >= 60 or pressure_level == "中等":
            # 中度压力: 推荐舒缓食物，适度放松
            comfort_keywords = ["茶", "粥", "汤", "日料", "轻食", "沙拉",
                               "蔬菜", "面", "蒸"]
            heavy_keywords = ["麻辣", "火锅", "烧烤", "油炸"]
            if any(k in cuisine_str for k in comfort_keywords):
                context_bonus += 0.15
            elif any(k in cuisine_str for k in heavy_keywords):
                context_bonus -= 0.08
        elif pressure_value <= 30 or pressure_level == "放松":
            # 放松态: 探索性饮食，奖励丰富口味
            adventure_keywords = ["新疆", "泰国", "印度", "韩国", "日料", "西餐",
                                 "创意", "甜品", "下午茶"]
            if any(k in cuisine_str for k in adventure_keywords):
                context_bonus += 0.10

        # ----- 5.3 睡眠质量影响 (NSF 国家睡眠基金会 + WHO) -----
        # 睡眠不足: 色氨酸(火鸡/香蕉/牛奶)助眠, 维B6促褪黑素合成
        # 严重缺觉: 避免过量咖啡因(>400mg/日), 避免高糖导致血糖波动
        sleep_duration_hours = health_ctx.get("last_sleep_duration_hours", 0)
        sleep_quality = health_ctx.get("sleep_quality", "无数据")
        sleep_score = health_ctx.get("last_sleep_score", 0)
        needs_rest = health_ctx.get("needs_rest", False)

        if sleep_duration_hours < 5 or sleep_score < 40:
            # 严重睡眠不足(<5h): 稳定血糖 + 色氨酸 + 避免兴奋剂
            recovery_keywords = ["粥", "汤", "面", "蛋白", "鸡肉", "鱼", "蒸",
                                "牛奶", "香蕉", "全麦", "燕麦", "蔬菜"]
            avoid_keywords = ["咖啡", "火锅", "烧烤", "油炸", "酒", "夜宵",
                             "奶茶", "甜品", "冰淇淋"]  # 高糖高咖啡因
            if any(k in cuisine_str for k in recovery_keywords):
                context_bonus += 0.25
            elif any(k in cuisine_str for k in avoid_keywords):
                context_bonus -= 0.18
        elif sleep_duration_hours < 6 or sleep_quality == "较差" or sleep_score < 60 or needs_rest:
            # 轻度睡眠不足(5-6h): 温和能量补充
            energy_keywords = ["粥", "汤", "面", "蛋白", "鸡肉", "牛肉",
                              "早餐", "全麦", "蔬菜", "健康"]
            heavy_keywords = ["火锅", "烧烤", "油炸", "夜宵", "酒"]
            if any(k in cuisine_str for k in energy_keywords):
                context_bonus += 0.15
            elif any(k in cuisine_str for k in heavy_keywords):
                context_bonus -= 0.10
        elif sleep_duration_hours >= 7 and (sleep_quality in ["优秀", "良好"] or sleep_score >= 80):
            # 睡眠充足(≥7h): 精力充沛，可享受丰富美食
            if rating >= 4.3:
                context_bonus += 0.08

        # ----- 5.4 血氧饱和度 (WHO 临床标准) -----
        # SpO2 <90%: 严重低氧, 90-94%: 低氧, ≥95%: 正常
        # 低氧时消化能力下降，需易消化+补铁+补维C食物
        blood_oxygen = health_ctx.get("blood_oxygen", 98)
        blood_oxygen_status = health_ctx.get("blood_oxygen_status", "正常")
        if blood_oxygen < 90 or blood_oxygen_status == "低氧":
            # 严重低氧: 强推补铁+维C+易消化
            iron_rich = ["牛肉", "菠菜", "蛋", "鱼", "豆腐", "粥", "汤", "蒸",
                        "蔬菜", "清淡", "轻食"]
            hard_digest = ["油炸", "烧烤", "火锅", "麻辣", "重口味", "酒",
                          "炸鸡", "披萨", "汉堡"]
            if any(k in cuisine_str for k in iron_rich):
                context_bonus += 0.30
            elif any(k in cuisine_str for k in hard_digest):
                context_bonus -= 0.25
        elif blood_oxygen < 95 or blood_oxygen_status == "偏低":
            # 轻度低氧: 推荐清淡易消化
            health_keywords = ["轻食", "沙拉", "粥", "汤", "蒸", "清淡", "蔬菜",
                              "牛肉", "菠菜", "鱼"]
            avoid_keywords = ["油炸", "烧烤", "火锅", "麻辣", "重口味", "酒"]
            if any(k in cuisine_str for k in health_keywords):
                context_bonus += 0.18
            elif any(k in cuisine_str for k in avoid_keywords):
                context_bonus -= 0.15

        # ----- 5.5 活动水平 (ACSM 运动医学会 + WHO 体力活动指南) -----
        # WHO: 成人每周≥150min中等强度 或 ≥75min高强度
        # ACSM: 久坐风险独立于运动量，每30min应起身活动
        daily_steps = health_ctx.get("daily_steps", 0)
        daily_calories = health_ctx.get("daily_calories", 0)
        activity_level = health_ctx.get("activity_level", "无数据")

        if daily_steps >= 15000 or daily_calories >= 600:
            # 超高活动量(≥15000步): 需大量碳水+蛋白补充糖原
            replenish_keywords = ["蛋白", "肉", "牛肉", "鸡肉", "鱼", "米饭", "面",
                                 "碳水", "全麦", "香蕉", "能量", "健康"]
            if any(k in cuisine_str for k in replenish_keywords):
                context_bonus += 0.20
        elif daily_steps >= 8000 or activity_level == "活跃" or daily_calories >= 300:
            # 活跃(8000-15000步): 均衡营养补充
            energy_keywords = ["蛋白", "肉", "牛肉", "鸡肉", "碳水", "米饭", "面",
                              "能量", "健康", "沙拉"]
            if any(k in cuisine_str for k in energy_keywords):
                context_bonus += 0.12
        elif daily_steps < 2000 and activity_level in ["久坐", "轻度"]:
            # 久坐(<2000步): ACSM建议低卡低脂，增加纤维
            fiber_light = ["轻食", "沙拉", "蔬菜", "清淡", "低脂", "健康", "蒸",
                          "粥", "全麦", "粗粮"]
            calorie_dense = ["火锅", "烤肉", "炸鸡", "汉堡", "披萨", "奶茶",
                            "甜品", "油炸", "薯条"]
            if any(k in cuisine_str for k in fiber_light):
                context_bonus += 0.15
            elif any(k in cuisine_str for k in calorie_dense):
                context_bonus -= 0.12
        elif daily_steps < 5000:
            # 轻度活动(2000-5000步): 适度控制热量
            light_keywords = ["轻食", "沙拉", "蔬菜", "健康", "清淡"]
            if any(k in cuisine_str for k in light_keywords):
                context_bonus += 0.06

        # ----- 5.6 综合健康状态 (AHA + WHO 综合评估) -----
        overall_health = health_ctx.get("overall_health_status", "无数据")
        if overall_health == "需关注":
            # AHA: 限钠<1500mg, 限添加糖<25g, 增蔬果≥400g
            aha_healthy = ["轻食", "沙拉", "蔬菜", "蒸", "清淡", "健康", "粥",
                          "汤", "鱼", "全麦", "豆腐", "日料"]
            aha_avoid = ["油炸", "烧烤", "火锅", "麻辣", "重口味", "夜宵",
                        "酒", "甜品", "奶茶", "炸鸡", "汉堡", "薯条"]
            if any(k in cuisine_str for k in aha_healthy):
                context_bonus += 0.25
            elif any(k in cuisine_str for k in aha_avoid):
                context_bonus -= 0.20
        elif overall_health == "良好":
            # 健康良好: 适度推荐均衡饮食
            if rating >= 4.3:
                context_bonus += 0.05
        elif overall_health == "优秀":
            # 健康优秀: 自由享受
            if rating >= 4.5:
                context_bonus += 0.08
        
        # ========== 🆕 6. 绝对意图匹配（最高优先级，实现"指名道姓"的推荐） ==========
        pure_query = context.get("pure_query", "").strip()
        if pure_query and pure_query not in ["餐厅", "美食", "饭店"]:
            pure_query_lower = pure_query.lower()
            name_str = str(arm.name).lower()
            if pure_query_lower in name_str or pure_query_lower in cuisine_str:
                context_bonus += 0.40  # 给极高分数加成，保证冲上榜首
                logger.info(f"🎯 绝对意图命中: '{pure_query}' 匹配了餐厅 '{arm.name}'，获得一票否决级加分 0.40")

        # 7. 节日/周末影响
        temporal_ctx = env.get("temporal", {})
        if temporal_ctx.get("is_holiday", False) or temporal_ctx.get("festival"):
            if rating >= 4.5:
                context_bonus += 0.08
        
        # 加入历史奖励（小幅加成）
        historical_score = arm.average_reward * 0.05
        
        # ========== 🆕 8. 协同过滤分数融合 (CollaborativeAgent NCF 信号) ==========
        cf_bonus = 0.0
        cf_scores = context.get("collaborative_scores", {})
        cf_weight = context.get("cf_weight", 0.0)
        if cf_scores and cf_weight > 0:
            cf_raw = cf_scores.get(str(arm.restaurant_id), 0.0)
            cf_bonus = cf_raw * cf_weight
            if cf_bonus > 0.02:
                logger.info(
                    f"🤝 CF加成: {arm.name} cf_raw={cf_raw:.3f} × α={cf_weight:.3f} → +{cf_bonus:.3f}"
                )
        
        # ========== 🆕 9. 环境光线影响（端侧光传感器信号） ==========
        light_level = health_ctx.get("light_level", "normal")
        if light_level in ("dark", "dim"):
            # 暗光/夜间 → 偏向夜宵、热饮、暖食
            night_keywords = ["夜宵", "烧烤", "串", "火锅", "热饮", "奶茶", "粥", "酒吧", "小龙虾", "烤肉"]
            cold_keywords = ["沙拉", "冰", "冷饮", "刺身", "冰淇淋"]
            if any(k in cuisine_str for k in night_keywords):
                context_bonus += 0.15
            elif any(k in cuisine_str for k in cold_keywords):
                context_bonus -= 0.08
        elif light_level in ("bright", "sunlight"):
            # 强光/户外 → 偏向冰饮、清爽、外带友好
            cool_keywords = ["冰", "冷饮", "果汁", "沙拉", "轻食", "奶茶", "冰淇淋", "甜品"]
            heavy_keywords = ["火锅", "烧烤", "麻辣", "烤肉"]
            if any(k in cuisine_str for k in cool_keywords):
                context_bonus += 0.12
            elif any(k in cuisine_str for k in heavy_keywords):
                context_bonus -= 0.06

        # 最终得分 = 基础分 + 可变分 + 上下文加成 + 历史 + 协同过滤
        # 强上下文时可变分乘数更高（因为菜系匹配权重从0.20提升到0.40，需要更大的分差）
        var_multiplier = 0.65 if has_strong_context else 0.50
        final_score = base_score + variable_score * var_multiplier + context_bonus + historical_score + cf_bonus
        
        # 调试日志：有上下文加成时打印（包含完整健康数据）
        if abs(context_bonus) > 0.01:
            health_info = (
                f"post_workout={health_ctx.get('is_post_workout', False)}, "
                f"pressure={pressure_value}, "
                f"sleep={sleep_duration_hours:.1f}h/{sleep_quality}, "
                f"blood_o2={blood_oxygen}%, "
                f"steps={daily_steps}, "
                f"health={overall_health}"
            )
            logger.info(
                f"📊 {arm.name}: base={base_score:.2f} var={variable_score*0.3:.2f} ctx={context_bonus:+.2f} → {final_score:.2f} "
                f"(temp={temperature}, light={light_level}, {health_info}, cuisine={cuisine_str[:10]})"
            )
        
        return max(0.0, min(1.0, final_score))


class DecisionAgent(BaseAgent):  
    def __init__(self, strategy: str = "contextual", llm_client=None):
        super().__init__(
            name="DecisionAgent",
            description="决策智能体 - 基于MAB算法进行智能推荐决策"
        )
        
        # MAB 策略
        self.strategy_name = strategy
        self.strategy = self._create_strategy(strategy)
        
        # LLM 客户端（用于生成推荐理由）
        if llm_client:
            self.llm_client = llm_client
        else:
            # 默认使用 DeepSeek
            self.llm_client = AsyncOpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY", ""),
                base_url="https://api.deepseek.com/v1"
            )
        self.llm_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

        # 餐厅臂的历史数据
        self._arms_history: Dict[str, RestaurantArm] = {}
        
        # 注册工具
        self._register_tools()

    def _create_strategy(self, strategy: str) -> MABStrategy:
        """创建 MAB 策略"""
        strategies = {
            "ucb1": UCB1Strategy(),
            "thompson": ThompsonSamplingStrategy(),
            "epsilon": EpsilonGreedyStrategy(),
            "contextual": ContextualBanditStrategy()
        }
        
        # ML Ensemble 策略: LightGBM + DeepFM 融合排序
        if strategy == "ml_ensemble" and ML_AVAILABLE:
            try:
                fallback = ContextualBanditStrategy()
                ml_strategy = EnsembleMLStrategy(
                    lgb_weight=float(os.getenv("ML_LGB_WEIGHT", "0.6")),
                    deepfm_weight=float(os.getenv("ML_DEEPFM_WEIGHT", "0.4")),
                    fallback_strategy=fallback
                )
                logger.info("🤖 已创建 ML Ensemble 策略 (LightGBM + DeepFM)")
                return ml_strategy
            except Exception as e:
                logger.warning(f"⚠️ ML Ensemble 策略创建失败，降级到 contextual: {e}")
                return ContextualBanditStrategy()
        elif strategy == "ml_ensemble":
            logger.warning("⚠️ ML 模块不可用，降级到 contextual 策略")
            return ContextualBanditStrategy()
        
        return strategies.get(strategy, ContextualBanditStrategy())
    
    def _register_tools(self):
        """注册智能体工具"""
        
        # 推荐决策工具
        decision_tool = Tool(
            name="make_recommendation_decision",
            description="基于MAB算法做出推荐决策",
            input_schema={
                "type": "object",
                "properties": {
                    "restaurants": {"type": "array", "description": "候选餐厅列表"},
                    "context": {"type": "object", "description": "决策上下文"},
                    "top_k": {"type": "integer", "description": "返回前K个推荐"}
                },
                "required": ["restaurants"]
            },
            handler=self._make_decision_handler
        )
        global_tool_registry.register(decision_tool)
        
        # 更新奖励工具
        reward_tool = Tool(
            name="update_reward",
            description="更新餐厅的奖励值（用户反馈）",
            input_schema={
                "type": "object",
                "properties": {
                    "restaurant_id": {"type": "string", "description": "餐厅ID"},
                    "reward": {"type": "number", "description": "奖励值 (0-1)"}
                },
                "required": ["restaurant_id", "reward"]
            },
            handler=self._update_reward_handler
        )
        global_tool_registry.register(reward_tool)
        
    def get_capabilities(self) -> List[str]:
        """返回智能体能力"""
        return [
            "mab_decision",           # MAB 决策
            "ranking",                # 排序
            "reasoning_generation",   # 推理生成
            "reward_learning",        # 奖励学习
        ]
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理决策请求
        
        Args:
            input_data: 包含以下字段
                - restaurants: 候选餐厅列表
                - context_analysis: 环境分析结果
                - profile_analysis: 用户画像分析结果
                - user_query: 用户查询
                - top_k: 返回数量
                
        Returns:
            推荐决策结果
        """
        start_time = datetime.now()
        self.update_state("processing", "making_decision")
        
        try:
            restaurants = input_data.get("restaurants", [])
            context_analysis = input_data.get("context_analysis", {})
            profile_analysis = input_data.get("profile_analysis", {})
            collaborative_analysis = input_data.get("collaborative_analysis", {})
            user_query = input_data.get("user_query", "")
            top_k = input_data.get("top_k", 10)
            health_context = input_data.get("health_context", {})
            weather_context = input_data.get("weather_context", {})
            
            if not restaurants:
                return {
                    "success": False,
                    "agent": self.name,
                    "error": "No restaurants provided"
                }
            
            # 构建决策上下文
            decision_context = self._build_decision_context(
                context_analysis, profile_analysis
            )
            
            # 🆕 注入前端传入的健康/天气/纯净意图到决策上下文
            if health_context:
                decision_context["health_context"] = health_context
                if health_context.get("is_post_workout"):
                    logger.info(f"🏃 检测到运动后状态，调整推荐排序")
                
                # 提取并应用端云协同脱敏硬性约束
                if health_context.get("edge_constraints"):
                    decision_context["edge_constraints"] = health_context.get("edge_constraints")
                    logger.info(f"🛡️ 接收到端侧隐私约束: {decision_context['edge_constraints']}")
                
                # 🆕 提取纯净查询（由 Service 层透传过来）
                pure_query = health_context.get("pure_query", "")
                if pure_query:
                    decision_context["pure_query"] = pure_query
                    
            if weather_context:
                # 将前端天气单独存储为 frontend_weather，优先级最高
                decision_context["frontend_weather"] = weather_context
                # 同时合并到环境天气
                if weather_context.get("is_heavy_rain") or weather_context.get("is_raining"):
                    decision_context["is_bad_weather"] = True
                    logger.info(f"🌧️ 检测到雨天，调整推荐排序")
                # 强制覆盖后端降级的默认温度
                frontend_temp = weather_context.get("temperature")
                if frontend_temp is not None:
                    env_weather = decision_context.get("environment", {}).get("weather", {})
                    env_weather["temperature"] = frontend_temp  # 始终用前端温度
                    if "environment" not in decision_context:
                        decision_context["environment"] = {}
                    decision_context["environment"]["weather"] = env_weather
                    logger.info(f"🌡️ 使用前端传入温度: {frontend_temp}°C")
            
            # 🆕 注入协同过滤分数 (来自 CollaborativeAgent)
            if collaborative_analysis and collaborative_analysis.get("collaborative_scores"):
                decision_context["collaborative_scores"] = collaborative_analysis["collaborative_scores"]
                decision_context["cf_weight"] = collaborative_analysis.get("cf_weight", 0.0)
                logger.info(
                    f"🤝 注入协同过滤分数: {collaborative_analysis.get('num_scored', 0)} 家餐厅, "
                    f"α={decision_context['cf_weight']:.3f}, "
                    f"Encoder={collaborative_analysis.get('encoder_mode', 'unknown')}, "
                    f"NCF={collaborative_analysis.get('ncf_mode', 'unknown')}"
                )
            
            # 将餐厅转换为 MAB 臂
            arms = self._restaurants_to_arms(restaurants)
            
            # 端云协同前置硬过滤 (Hard-Filter)
            # 确保端侧不允许的敏感物质/菜品类别被完全拦截，防止被推荐
            edge_constraints = decision_context.get("edge_constraints")
            if edge_constraints:
                filtered_arms = []
                forbidden_ingredients = edge_constraints.get("forbidden_ingredients", [])
                required_temperature = edge_constraints.get("required_temperature", [])
                
                for arm in arms:
                    cuisine_str = str(arm.features.get("cuisine", "")).lower()
                    name_str = str(arm.name).lower()
                    is_hot_food = arm.features.get("is_hot_food", True)
                    
                    # 1. 检查过敏原及违禁成分 (例如端侧测出过敏史，直接过滤)
                    is_forbidden = False
                    for forbidden in forbidden_ingredients:
                        if forbidden.lower() in cuisine_str or forbidden.lower() in name_str:
                            is_forbidden = True
                            logger.info(f"🛡️ 端云协同拦截: 餐厅 '{arm.name}' 包含端侧屏蔽敏感成分 '{forbidden}'")
                            break
                    if is_forbidden:
                        continue
                        
                    # 2. 检查硬性温度限制 (例如生理期要求，屏蔽冰沙/冷饮)
                    if required_temperature:
                        # 识别是否明显是冷饮生冷品
                        is_cold = any(k in cuisine_str or k in name_str for k in ["冰", "冷", "凉", "沙拉", "刺身"])
                        
                        # 如果端侧强制要求热饮或常温
                        if any(t in ["热", "常温", "温"] for t in required_temperature):
                            if is_cold or not is_hot_food:
                                logger.info(f"🛡️ 端云协同拦截: 餐厅 '{arm.name}' 不符合端侧温度健康约束 '{required_temperature}'")
                                continue
                                
                    filtered_arms.append(arm)
                
                arms = filtered_arms
                if not arms:
                    logger.warning("🛡️ 端侧约束过于严格，当前区域所有餐厅均被拦截，触发容错降级流程")
                    # 没餐厅了不让后续代码报错，正常走完流程并返回空列表
            
            # 用户忌口/过敏原硬过滤（来自前端用户设置）
            user_allergies = health_context.get("allergies", []) if health_context else []
            if user_allergies:
                pre_filter_count = len(arms)
                filtered_by_allergy = []
                # 构建关键词映射：将忌口标签展开为具体关键词
                allergy_keywords = []
                for allergy in user_allergies:
                    allergy_lower = allergy.lower()
                    allergy_keywords.append(allergy_lower)
                    # 展开常见忌口到具体食材关键词
                    expansion = {
                        "花生过敏": ["花生", "坚果"],
                        "海鲜过敏": ["海鲜", "鱼", "虾", "蟹", "贝", "海"],
                        "乳糖不耐受": ["奶", "乳", "芝士", "cheese"],
                        "麸质过敏": ["面", "麦", "面包", "饺", "馒头"],
                        "鸡蛋过敏": ["蛋", "鸡蛋"],
                        "坚果过敏": ["坚果", "核桃", "杏仁", "腰果"],
                        "不吃辣": ["辣", "麻辣", "川菜", "火锅", "湘菜"],
                        "素食": ["肉", "鸡", "鸭", "猪", "牛", "羊", "鱼", "虾"],
                        "不吃猪肉": ["猪", "猪肉", "排骨", "回锅肉"],
                        "不吃牛肉": ["牛", "牛肉", "牛排"],
                        "痛风忌高嘌呤": ["海鲜", "内脏", "啤酒", "火锅"],
                        "高血压忌高钠": ["腌", "咸", "酱", "烧烤"],
                        "糖尿病忌高糖": ["甜品", "蛋糕", "奶茶", "甜", "糖"],
                    }
                    if allergy in expansion:
                        allergy_keywords.extend(expansion[allergy])

                for arm in arms:
                    cuisine_str = str(arm.features.get("cuisine", "")).lower()
                    name_str = str(arm.name).lower()
                    check_str = cuisine_str + " " + name_str

                    is_blocked = False
                    for keyword in allergy_keywords:
                        if keyword in check_str:
                            logger.info(f"忌口过滤: 餐厅 '{arm.name}' 匹配忌口关键词 '{keyword}'，已排除")
                            is_blocked = True
                            break
                    if not is_blocked:
                        filtered_by_allergy.append(arm)

                arms = filtered_by_allergy
                logger.info(f"忌口过滤完成: {pre_filter_count} -> {len(arms)} 家餐厅 (忌口: {user_allergies})")

            # 使用 MAB 策略排序 (对于已经过安全过滤的餐厅)
            ranked_arms = self.strategy.rank_all(arms, decision_context)
            
            # 📦 异步记录推荐曝光数据（用于 ML 模型训练）
            if ML_AVAILABLE:
                try:
                    collector = get_data_collector()
                    impression_data = [
                        {
                            "restaurant_id": arm.restaurant_id,
                            "features": arm.features,
                            "pulls": arm.pulls,
                            "avg_reward": arm.average_reward,
                            "rank": idx + 1,
                        }
                        for idx, arm in enumerate(ranked_arms[:top_k])
                    ]
                    asyncio.create_task(
                        collector.log_batch_impressions(impression_data, decision_context)
                    )
                except Exception as e:
                    logger.debug(f"训练数据记录失败（不影响推荐）: {e}")
            
            # 生成推荐结果
            recommendations = self._arms_to_recommendations(
                ranked_arms[:top_k], decision_context
            )
            
            # 使用 DeepSeek AI 生成个性化推荐理由
            recommendations = await self.generate_ai_reasons(
                recommendations, decision_context
            )

            # 生成推荐理由
            reasoning = await self._generate_reasoning(
                recommendations, context_analysis, profile_analysis, user_query
            )
            
            # 计算置信度
            confidence = self._calculate_confidence(
                recommendations, context_analysis, profile_analysis
            )
            
            result = {
                "success": True,
                "agent": self.name,
                "recommendations": recommendations,
                "reasoning": reasoning,
                "confidence_score": confidence,
                "strategy_used": self.strategy_name,
                "total_candidates": len(restaurants),
                "decision_factors": decision_context,
                "timestamp": datetime.now().isoformat()
            }
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.state.processing_time_ms = processing_time
            self.update_state("completed", "making_decision", result)
            
            logger.info(f"DecisionAgent completed decision in {processing_time:.1f}ms, selected {len(recommendations)} restaurants")
            return result
            
        except Exception as e:
            logger.error(f"DecisionAgent processing failed: {e}")
            self.update_state("error", error=str(e))
            return {
                "success": False,
                "agent": self.name,
                "error": str(e)
            }
    
    def _build_decision_context(self, context_analysis: Dict[str, Any],
                                   profile_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """构建决策上下文"""
        # 从环境分析中提取
        environment = context_analysis.get("environment_impact", {})
        weather = context_analysis.get("weather", {})
        traffic = context_analysis.get("traffic", {})
        temporal = context_analysis.get("temporal", {})
        
        # 从用户画像中提取
        profile = profile_analysis.get("profile", {})
        weights = profile_analysis.get("recommendation_weights", {})
        adjusted_prefs = profile_analysis.get("adjusted_preferences", {})
        intent = profile_analysis.get("intent_analysis", {})
        
        return {
            # 推荐权重
            "weights": weights or {
                "distance": 0.25,
                "rating": 0.25,
                "price": 0.20,
                "cuisine_match": 0.20,
                "delivery_time": 0.10
            },

            # 距离限制
            "max_distance": environment.get("recommended_max_distance", 20000),
            
            # 价格限制
            "min_price": profile.get("price_range", {}).get("min", 0),
            "max_price": profile.get("price_range", {}).get("max", 100),
            
            # 偏好菜系
            "preferred_cuisines": adjusted_prefs.get("cuisines", profile.get("preferred_cuisines", [])),
            
            # 紧急程度
            "urgency": intent.get("urgency", "normal"),
            
            # 环境因素
            "is_bad_weather": weather.get("is_bad_weather", False),
            "is_peak_hour": temporal.get("is_peak_hour", False),
            "congestion_index": traffic.get("congestion_index", 1.0),
            
            # 用户分群
            "user_segment": profile.get("user_segment", "standard"),
            
            # 健康上下文（用于运动后推荐调整）
            "health_context": context_analysis.get("health_context", {}),
            
            # 完整的环境信息（用于生成推荐理由）
            "environment": {
                "weather": weather,
                "temporal": temporal,
                "traffic": traffic
            }
        }

    def _restaurants_to_arms(self, restaurants: List[Dict[str, Any]]) -> List[RestaurantArm]:
        """将餐厅转换为 MAB 臂"""
        arms = []
        for r in restaurants:
            restaurant_id = r.get("id", str(id(r)))
            
            # 检查历史数据
            if restaurant_id in self._arms_history:
                arm = self._arms_history[restaurant_id]
                # 更新特征
                arm.features = self._extract_features(r)
            else:
                arm = RestaurantArm(
                    restaurant_id=restaurant_id,
                    name=r.get("name", "Unknown"),
                    pulls=0,
                    rewards=0.0,
                    features=self._extract_features(r)
                )
                self._arms_history[restaurant_id] = arm
            
            arms.append(arm)
        
        return arms
    
    def _extract_features(self, restaurant: Dict[str, Any]) -> Dict[str, Any]:
        """提取餐厅特征"""
        return {
            "distance": restaurant.get("distance", 2000),
            "rating": restaurant.get("rating", 4.0),
            "price": restaurant.get("avg_price", 40),
            "cuisine": restaurant.get("cuisine_type", ""),
            "delivery_time": restaurant.get("estimated_delivery_time", 30),
            "is_hot_food": restaurant.get("is_hot_food", True),
            "order_count": restaurant.get("order_count", 0),
            "image": restaurant.get("image"),  # 图片字段
            "address": restaurant.get("address", ""),  # 地址
        }
    
    def _arms_to_recommendations(self, arms: List[RestaurantArm],
                                       context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """将 MAB 臂转换为推荐结果"""
        recommendations = []

        for i, arm in enumerate(arms):
            score = self._calculate_display_score(arm, context)
            # 先用规则生成快速理由，后续异步用AI优化
            reason = self._generate_quick_reason(arm, context, i + 1, score)
            
            rec = {
                "rank": i + 1,
                "restaurant_id": arm.restaurant_id,
                "name": arm.name,
                "score": score,
                "reason": reason,  # 每个餐厅的个性化推荐理由
                "features": arm.features,
                # 直接暴露关键字段便于前端使用
                "rating": arm.features.get("rating", 4.0),
                "distance": arm.features.get("distance", 1000),
                "estimated_delivery_time": arm.features.get("delivery_time", 30),
                "cuisine_type": arm.features.get("cuisine", arm.features.get("cuisine_type", "")),
                "avg_price": arm.features.get("price", arm.features.get("avg_price", 30)),
                "image": arm.features.get("image"),  # 图片字段
                "mab_stats": {
                    "pulls": arm.pulls,
                    "average_reward": arm.average_reward
                }
            }
            recommendations.append(rec)

        return recommendations
    
    def _generate_quick_reason(self, arm: RestaurantArm,
                               context: Dict[str, Any],
                               rank: int,
                               score: float) -> str:
        """快速生成推荐理由（规则版本，结合天气/日期/交通/健康数据，作为AI的fallback）"""
        features = arm.features
        env = context.get("environment", {})
        weather = env.get("weather", {})
        temporal = env.get("temporal", {})
        traffic = env.get("traffic", {})
        health_ctx = context.get("health_context", {})

        temperature = weather.get("temperature", 20)
        weather_condition = weather.get("condition", "晴")
        is_bad_weather = weather.get("is_bad_weather", False)

        meal_period = temporal.get("meal_period", "lunch")
        hour = temporal.get("hour", 12)
        is_weekend = temporal.get("is_weekend", False)
        is_holiday = temporal.get("is_holiday", False)
        festival = temporal.get("festival", "")

        congestion_level = traffic.get("congestion_level", "畅通")
        congestion_index = traffic.get("congestion_index", 1.0)

        rating = features.get("rating", 4.0) or 4.0
        distance = features.get("distance", 1000) or 1000
        delivery_time = features.get("delivery_time", 25) or 25
        cuisine = features.get("cuisine", features.get("cuisine_type", ""))

        # 健康数据
        pressure_value = health_ctx.get("pressure_value", 50)
        pressure_level = health_ctx.get("pressure_level", "正常")
        sleep_duration = health_ctx.get("last_sleep_duration_hours", 0)
        sleep_quality = health_ctx.get("sleep_quality", "无数据")
        blood_oxygen = health_ctx.get("blood_oxygen", 98)
        daily_steps = health_ctx.get("daily_steps", 0)
        is_post_workout = health_ctx.get("is_post_workout", False)
        overall_health = health_ctx.get("overall_health_status", "无数据")

        # 构建理由部分
        parts = []

        # 1. 排名标识
        if rank == 1:
            parts.append("今日首推")
        elif rank <= 3:
            parts.append("精选好店")

        # 2. 天气+温度相关（核心卖点）
        if temperature <= 10:
            if any(k in cuisine for k in ["火锅", "汤", "粥", "麻辣", "烤"]):
                parts.append(f"{temperature}°C天寒，热食暖身")
            else:
                parts.append(f"{temperature}°C寒冷天气首选")
        elif temperature >= 30:
            if any(k in cuisine for k in ["冷", "凉", "沙拉", "饮", "冰"]):
                parts.append(f"{temperature}°C炎热，清凉解暑")
            else:
                parts.append(f"{temperature}°C高温天开胃之选")

        # 天气状况特殊处理
        if is_bad_weather or weather_condition in ["暴雨", "大雨", "中雨"]:
            if distance <= 1500 and delivery_time <= 30:
                parts.append(f"{weather_condition}天气，配送快")
        elif weather_condition in ["小雨", "阴"]:
            parts.append(f"{weather_condition}天暖心推荐")

        # 3. 时间段相关
        if is_holiday or festival:
            parts.append(f"{festival or '假日'}精选")
        elif is_weekend:
            parts.append("周末犒劳自己")

        period_tips = {
            "breakfast": "早餐好选择",
            "lunch": "午餐快速送达" if delivery_time <= 25 else "",
            "dinner": "晚餐精选",
            "afternoon_tea": "下午茶时光",
            "night_snack": "夜宵必点"
        }
        period_tip = period_tips.get(meal_period, "")
        if period_tip:
            parts.append(period_tip)

        # 4. 交通相关
        if congestion_index > 1.5 or congestion_level in ["拥堵", "严重拥堵"]:
            if distance <= 1000:
                parts.append("拥堵时段近距离优选")

        # 5. 基础评分和距离
        if rating >= 4.5:
            parts.append(f"{rating}分高评")
        elif rating >= 4.0:
            parts.append(f"好评{rating}分")

        if distance <= 500:
            parts.append("距离超近")
        elif distance <= 1000:
            parts.append("就在附近")

        # 6. 配送速度
        if delivery_time <= 20:
            parts.append("闪电配送")

        # ========== 7. 健康状态相关推荐理由（OPPO健康数据） ==========
        cuisine_lower = cuisine.lower() if cuisine else ""

        # 运动后推荐
        if is_post_workout:
            healthy_keywords = ["轻食", "沙拉", "健康", "蛋白", "鸡胸", "鱼", "日料", "蒸", "粥"]
            if any(k in cuisine_lower for k in healthy_keywords):
                parts.append("运动后能量补充")
            else:
                parts.append("运动后适量进食")

        # 压力状态
        if pressure_value >= 70 or pressure_level in ["偏高", "中等"]:
            comfort_keywords = ["甜品", "奶茶", "咖啡", "蛋糕", "茶", "日料", "轻食"]
            if any(k in cuisine_lower for k in comfort_keywords):
                parts.append("舒缓心情之选")
            else:
                parts.append("放松身心好时光")

        # 睡眠不足
        if sleep_duration > 0 and sleep_duration < 6 or sleep_quality == "较差":
            energy_keywords = ["咖啡", "茶", "蛋白", "能量", "粥", "面", "汤"]
            if any(k in cuisine_lower for k in energy_keywords):
                parts.append("提神醒脑好选择")
            else:
                parts.append("补充元气")

        # 高活动量
        if daily_steps >= 10000:
            energy_keywords = ["蛋白", "肉", "牛肉", "碳水", "面", "米饭", "鸡"]
            if any(k in cuisine_lower for k in energy_keywords):
                parts.append("活动量大，补充能量")
            else:
                parts.append("高消耗后犒劳自己")

        # 健康状态需关注
        if overall_health == "需关注":
            healthy_keywords = ["轻食", "沙拉", "蔬菜", "蒸", "清淡", "粥", "汤", "鱼", "日料"]
            if any(k in cuisine_lower for k in healthy_keywords):
                parts.append("健康饮食之选")
            else:
                parts.append("注意饮食均衡")

        # 高温天气
        if temperature >= 30:
            cold_keywords = ["冰", "凉", "沙拉", "冷", "饮", "果汁", "轻食"]
            if any(k in cuisine_lower for k in cold_keywords):
                parts.append(f"{temperature}度高温，清凉解暑")

        # 雨天
        if is_bad_weather or weather_condition in ["暴雨", "大雨", "中雨", "小雨"]:
            hot_keywords = ["火锅", "汤", "粥", "麻辣", "烤", "煲"]
            if any(k in cuisine_lower for k in hot_keywords):
                parts.append(f"{weather_condition}天暖胃首选")

        # 组合理由（去重并限制数量）
        unique_parts = list(dict.fromkeys(parts))  # 保持顺序去重
        if unique_parts:
            return "，".join(unique_parts[:3])  # 最多3个标签
        else:
            return f"综合评分{score:.0f}分，值得一试"
    
    async def generate_ai_reasons(self, recommendations: List[Dict[str, Any]], 
                                   context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """使用 DeepSeek AI 为所有餐厅生成个性化推荐理由（结合天气、日期、交通）"""
        if not self.llm_client or not recommendations:
            return recommendations
        
        try:
            env = context.get("environment", {})
            weather = env.get("weather", {})
            temporal = env.get("temporal", {})
            traffic = env.get("traffic", {})
            
            # 获取用户偏好信息
            preferred_cuisines = context.get("preferred_cuisines", [])
            user_segment = context.get("user_segment", "standard")
            max_price = context.get("max_price", 100)
            
            # 构建完整的环境描述（确保有合理默认值）
            temperature = weather.get("temperature") or weather.get("temp") or 22
            weather_condition = weather.get("condition") or weather.get("weather") or "晴"
            is_bad_weather = weather.get("is_bad_weather", False)
            humidity = weather.get("humidity", 60)
            
            # 从temporal中获取时间信息
            hour = temporal.get("hour") or temporal.get("current_hour")
            if hour is None:
                from datetime import datetime
                hour = datetime.now().hour
            
            meal_period = temporal.get("meal_period", "")
            if not meal_period:
                if 6 <= hour < 10:
                    meal_period = "breakfast"
                elif 11 <= hour < 14:
                    meal_period = "lunch"
                elif 14 <= hour < 17:
                    meal_period = "afternoon_tea"
                elif 17 <= hour < 21:
                    meal_period = "dinner"
                else:
                    meal_period = "night_snack"
            
            is_weekend = temporal.get("is_weekend", False)
            is_holiday = temporal.get("is_holiday", False)
            festival = temporal.get("festival", "")
            
            congestion_level = traffic.get("congestion_level") or traffic.get("status") or "畅通"
            congestion_index = traffic.get("congestion_index", 1.0)
            if isinstance(congestion_index, str):
                try:
                    congestion_index = float(congestion_index)
                except:
                    congestion_index = 1.0
            
            # 时间描述
            if is_holiday or festival:
                time_desc = f"节日（{festival}）" if festival else "假日"
            elif is_weekend:
                time_desc = "周末"
            else:
                time_desc = "工作日"
            
            period_map = {
                "breakfast": "早餐时段",
                "lunch": "午餐时段", 
                "dinner": "晚餐时段",
                "afternoon_tea": "下午茶时段",
                "night_snack": "夜宵时段"
            }
            period_desc = period_map.get(meal_period, "用餐时段")
            
            # 更智能的天气影响描述
            weather_analysis = []
            if is_bad_weather or weather_condition in ["暴雨", "大雨", "中雨", "雪", "大雪", "暴雪"]:
                weather_analysis.append(f"{weather_condition}天气，配送可能延迟，优先近距离餐厅")
            elif weather_condition in ["小雨", "阵雨"]:
                weather_analysis.append(f"有{weather_condition}，适合吃点暖心的")
            elif temperature <= 10:
                weather_analysis.append(f"气温仅{temperature}°C，推荐热食暖身")
            elif temperature >= 30:
                weather_analysis.append(f"高温{temperature}°C，适合清爽解暑美食")
            else:
                weather_analysis.append(f"{weather_condition}，{temperature}°C，适合各种美食")

            # 交通影响描述
            traffic_analysis = ""
            if congestion_index > 1.8 or congestion_level in ["严重拥堵", "拥堵"]:
                traffic_analysis = f"交通{congestion_level}，建议选择近距离餐厅"
            elif congestion_index > 1.3:
                traffic_analysis = f"交通略拥堵，注意配送时间"
            else:
                traffic_analysis = f"道路畅通，配送时间可控"
            
            # 用户偏好描述
            user_context = ""
            if preferred_cuisines:
                user_context = f"用户喜欢: {', '.join(preferred_cuisines[:3])}"
            if user_segment == "premium":
                user_context += "，注重品质"
            elif user_segment == "budget":
                user_context += f"，预算{max_price}元内"

            # 🆕 健康状态描述（OPPO健康SDK数据）
            health_ctx = context.get("health_context", {})
            health_analysis = []

            # 运动状态
            if health_ctx.get("is_post_workout", False):
                health_analysis.append("刚运动完，需要补充能量和蛋白质")

            # 压力状态
            pressure_value = health_ctx.get("pressure_value", 50)
            pressure_level = health_ctx.get("pressure_level", "正常")
            if pressure_value >= 70 or pressure_level in ["偏高", "中等"]:
                health_analysis.append(f"压力偏高({pressure_value}分)，需要舒缓放松")
            elif pressure_value <= 30 or pressure_level == "放松":
                health_analysis.append("心情放松，适合尝新")

            # 睡眠状态
            sleep_hours = health_ctx.get("last_sleep_duration_hours", 0)
            sleep_quality = health_ctx.get("sleep_quality", "无数据")
            if sleep_hours < 6 or sleep_quality == "较差":
                health_analysis.append(f"睡眠不足({sleep_hours:.1f}h)，需要提神补充能量")
            elif sleep_hours >= 7 and sleep_quality in ["优秀", "良好"]:
                health_analysis.append("睡眠充足，精神状态好")

            # 活动量
            daily_steps = health_ctx.get("daily_steps", 0)
            if daily_steps >= 10000:
                health_analysis.append(f"今日活动量大({daily_steps}步)，需要能量补充")
            elif daily_steps < 2000:
                health_analysis.append("久坐状态，建议清淡饮食")

            # 综合健康状态
            overall_health = health_ctx.get("overall_health_status", "无数据")
            if overall_health == "需关注":
                health_analysis.append("健康状态需关注，建议健康饮食")

            # 忌口信息
            user_allergies = health_ctx.get("allergies", [])
            if user_allergies:
                health_analysis.append(f"忌口/过敏原: {', '.join(user_allergies)}")

            health_context_str = "\n• ".join(health_analysis) if health_analysis else "健康状态正常"
            
            # 只给排名靠前的餐厅生成AI理由（LLM调用是主要耗时瓶颈，5家≈3秒，20家≈10秒）
            # 其余餐厅保留规则引擎生成的 quick_reason（毫秒级）
            target_count = min(len(recommendations), 20)
            target_restaurants = recommendations[:target_count]
            
            restaurants_info = "\n".join([
                f"{i+1}. {r['name']}（"
                f"{r['features'].get('cuisine', r['features'].get('cuisine_type', '综合'))}菜，"
                f"评分{r['features'].get('rating', 4.0)}，"
                f"距离{r['features'].get('distance', 1000) or 1000}米，"
                f"约{r['features'].get('delivery_time', 25) or 25}分钟送达，"
                f"人均¥{r['features'].get('price', r['features'].get('avg_price', 30)) or 30}）"
                for i, r in enumerate(target_restaurants)
            ])
            
            # 更智能的prompt，让DeepSeek理解完整上下文（包含健康数据）
            prompt = f"""你是一个贴心的美食推荐助手。请根据当前环境和用户健康状态为以下{target_count}家餐厅生成个性化推荐理由。

【当前环境】
- 天气：{weather_condition}，{temperature}度，湿度{humidity}%
- 时间：{time_desc} {period_desc}（{hour}点）
- 交通：{congestion_level}（拥堵指数{congestion_index:.1f}）

【健康状态】（来自OPPO健康监测）
- {health_context_str}

【环境分析】
- {weather_analysis[0]}
- {traffic_analysis}
{f"- {user_context}" if user_context else ""}

【待推荐餐厅】
{restaurants_info}

【输出要求】
1. 每条理由20-40字，必须体现当前真实环境（天气、温度、时段）和用户健康状态
2. 禁止使用任何emoji图标符号，只用纯文字
3. 每家餐厅的理由必须不同且具体，结合该餐厅的菜系特点，严禁出现雷同的泛用句式
4. 必须引用真实数据，如实际温度、实际天气、实际时段，不要编造
5. 根据环境和健康状态智能匹配：
   - 低温天+火锅/热汤类：提暖身驱寒
   - 雨天：强调温暖治愈、配送快
   - 拥堵时+近距离：提就在附近、快速送达
   - 周末/节日：可提犒劳自己
   - 运动后+轻食/蛋白类：提运动后补充
   - 压力大+甜品/奶茶：提舒缓压力
   - 睡眠不足+咖啡/茶：提提神醒脑
   - 活动量大+碳水/蛋白：提能量补给
6. 第1名可强调"今日首推"
7. 严格按以下格式输出，每行一条：
1. 理由内容
2. 理由内容
...依此类推（共{target_count}条）"""

            response = await self.llm_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": "你是一个温暖贴心的美食推荐助手。根据当前天气、时间、交通、用户健康状态等真实环境信息，为每家餐厅生成一句个性化且各不相同的推荐理由。禁止使用任何emoji图标符号，只用纯文字。每条理由必须具体、不雷同，体现该餐厅与当前环境的独特契合点。请严格按格式输出。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1200,
                temperature=0.8
            )
            
            ai_reasons = response.choices[0].message.content.strip()
            logger.info(f"🤖 AI生成推荐理由:\n{ai_reasons}")
            
            # 解析AI返回的理由 - 更健壮的解析
            import re
            lines = [line.strip() for line in ai_reasons.split("\n") if line.strip()]
            
            reason_idx = 0
            for line in lines:
                if reason_idx >= len(recommendations):
                    break
                # 匹配格式：数字 + 分隔符 + 理由内容
                match = re.match(r'^(\d+)[.、:：\s]+(.+)$', line)
                if match:
                    reason = match.group(2).strip()
                    if reason and len(reason) >= 8:  # 确保理由有效
                        recommendations[reason_idx]["reason"] = reason
                        reason_idx += 1
            
            logger.info(f"✅ 成功解析 {reason_idx} 条AI推荐理由")
            return recommendations
            
        except Exception as e:
            logger.warning(f"⚠️ AI生成推荐理由失败，使用规则理由: {e}")
            return recommendations

    def _generate_restaurant_reason(self, arm: RestaurantArm, 
                                     context: Dict[str, Any],
                                     rank: int,
                                     score: float) -> str:
        """为单个餐厅生成个性化推荐理由 - 结合天气、时间、温度等环境因素"""
        features = arm.features
        reasons = []
        
        # 获取完整的环境信息
        env = context.get("environment", {})
        weather = env.get("weather", {})
        temporal = env.get("temporal", {})
        traffic = env.get("traffic", {})
        
        # 提取具体数值
        temperature = weather.get("temperature", 20)
        weather_condition = weather.get("condition", "")
        is_bad_weather = weather.get("is_bad_weather", context.get("is_bad_weather", False))
        
        meal_period = temporal.get("meal_period", "lunch")
        hour = temporal.get("hour", 12)
        is_weekend = temporal.get("is_weekend", False)
        is_holiday = temporal.get("is_holiday", False)
        festival = temporal.get("festival", "")
        
        congestion = traffic.get("congestion_index", context.get("congestion_index", 1.0))
        
        # 餐厅特征
        rating = features.get("rating", 4.0)
        distance = features.get("distance", 2000)
        delivery_time = features.get("delivery_time", 30)
        avg_price = features.get("avg_price", features.get("price", 30))
        cuisine = features.get("cuisine_type", features.get("cuisine", ""))
        is_hot_food = features.get("is_hot_food", True)
        
        # ========== 1. 排名标识 ==========
        if rank == 1:
            reasons.append("今日首推")
        elif rank <= 3:
            reasons.append("精选推荐")

        # ========== 2. 天气+温度相关推荐 ==========
        if temperature <= 10:
            if is_hot_food:
                reasons.append(f"{temperature}°C寒冷天气，热食暖身")
            if any(k in cuisine for k in ["火锅", "砂锅", "汤", "粥", "麻辣"]):
                reasons.append("冬日暖胃首选")
        elif temperature >= 30:
            if any(k in cuisine for k in ["冷面", "沙拉", "凉皮", "冰", "饮"]):
                reasons.append(f"{temperature}°C高温，清凉解暑")
            else:
                reasons.append("开胃爽口")
        elif 10 < temperature < 20:
            reasons.append(f"{temperature}°C秋冬适宜")

        # 天气状况
        if weather_condition:
            if weather_condition in ["雨", "小雨", "中雨", "大雨", "暴雨"]:
                if distance <= 1000:
                    reasons.append("雨天近距离送达")
                if is_hot_food:
                    reasons.append("雨天热食暖心")
            elif weather_condition in ["雪", "小雪", "中雪", "大雪"]:
                reasons.append("雪天暖胃推荐")
            elif weather_condition in ["晴", "多云"]:
                if temperature >= 20 and temperature <= 28:
                    reasons.append("天气宜人，享美食")

        # ========== 3. 时间段相关推荐 ==========
        if meal_period == "breakfast" or (6 <= hour < 10):
            if any(k in cuisine for k in ["早餐", "粥", "豆浆", "包子", "油条", "面"]):
                reasons.append("早餐优选")
        elif meal_period == "lunch" or (11 <= hour < 14):
            if delivery_time <= 25:
                reasons.append("午餐快速送达")
        elif meal_period == "dinner" or (17 <= hour < 20):
            reasons.append("晚餐精选")
        elif meal_period == "afternoon_tea" or (14 <= hour < 17):
            if any(k in cuisine for k in ["甜品", "奶茶", "咖啡", "蛋糕", "下午茶"]):
                reasons.append("下午茶时光")
        elif meal_period == "night_snack" or hour >= 21 or hour < 6:
            if any(k in cuisine for k in ["烧烤", "小龙虾", "夜宵", "串串", "啤酒"]):
                reasons.append("夜宵必点")

        # ========== 4. 周末/节假日推荐 ==========
        if is_weekend:
            reasons.append("周末犒劳自己")
        if is_holiday or festival:
            fest_name = festival if festival else "假日"
            reasons.append(f"{fest_name}特惠")

        # ========== 5. 交通状况推荐 ==========
        if congestion > 1.5:
            if distance <= 800:
                reasons.append("拥堵时段近距离优选")

        # ========== 6. 基础评分推荐 ==========
        if rating >= 4.5:
            reasons.append(f"高分好评({rating}分)")
        elif rating >= 4.0:
            reasons.append(f"口碑不错({rating}分)")

        # ========== 7. 距离优势 ==========
        if distance <= 500:
            reasons.append("距离超近")
        elif distance <= 1000:
            reasons.append("距离较近")

        # ========== 8. 配送时间 ==========
        if delivery_time <= 20:
            reasons.append("配送快速")

        # ========== 9. 价格优势 ==========
        if avg_price <= 20:
            reasons.append("超高性价比")
        elif avg_price <= 35:
            reasons.append("价格实惠")

        # ========== 10. 回头客因素 ==========
        if arm.pulls > 5 and arm.average_reward > 0.7:
            reasons.append("回头客最爱")
        
        # 组合理由（去重并限制数量）
        unique_reasons = list(dict.fromkeys(reasons))  # 保持顺序去重
        if unique_reasons:
            return "，".join(unique_reasons[:4])  # 最多4个标签
        else:
            return f"综合评分{score:.0f}分，值得一试"

    def _calculate_display_score(self, arm: RestaurantArm,
                                 context: Dict[str, Any]) -> float:
        """计算展示分数（60-100分范围）"""
        # ML Ensemble 模式：直接用模型输出分数映射到 60-100
        ml_score = arm.features.get("_ml_score")
        if ml_score is not None:
            display_score = 60 + ml_score * 40  # 0~1 -> 60~100
            return round(max(60.0, min(100.0, display_score)), 1)
        
        if isinstance(self.strategy, ContextualBanditStrategy):
            raw_score = self.strategy._calculate_contextual_score(arm, context)
            # 确保分数在60-100范围内
            display_score = raw_score * 100
            return round(max(60.0, min(100.0, display_score)), 1)
        else:
            # 简单评分（也确保60-100范围）
            features = arm.features
            score = (
                features.get("rating", 4.0) * 15 +
                (1 - features.get("distance", 2000) / 20000) * 20 +
                arm.average_reward * 10
            )
            return round(min(100, max(0, score)), 1)
    
    async def _generate_reasoning(self, recommendations: List[Dict[str, Any]],
                                   context_analysis: Dict[str, Any],
                                   profile_analysis: Dict[str, Any],
                                   user_query: str) -> str:
        """生成推荐理由 - 结合天气、日期、交通等因素的有理有据解释"""
        if not recommendations:
            return "暂无符合条件的餐厅推荐"

        # 提取关键因素
        weather = context_analysis.get("weather", {})
        traffic = context_analysis.get("traffic", {})
        temporal = context_analysis.get("temporal", {})
        intent = profile_analysis.get("intent_analysis", {})
        profile = profile_analysis.get("profile", {})

        # 提取详细环境数据
        temperature = weather.get("temperature", 20)
        weather_condition = weather.get("condition", "晴")
        is_bad_weather = weather.get("is_bad_weather", False)
        humidity = weather.get("humidity", 50)
        
        congestion_level = traffic.get("congestion_level", "畅通")
        congestion_index = traffic.get("congestion_index", 1.0)
        
        hour = temporal.get("hour", 12)
        is_weekend = temporal.get("is_weekend", False)
        is_holiday = temporal.get("is_holiday", False)
        festival = temporal.get("festival", "")
        meal_period = temporal.get("meal_period", "lunch")

        reasoning_parts = []
        weight_explanations = []
        environment_summary = []

        # 环境概述（天气+交通+时间）
        # 天气描述
        if is_bad_weather or weather_condition in ["暴雨", "大雨", "中雨", "雪", "大雪"]:
            environment_summary.append(f"{weather_condition}（{temperature}°C）")
            reasoning_parts.append(f"由于当前{weather_condition}天气，优先为您推荐距离近、包装好、配送快的餐厅")
            weight_explanations.append("⚖️ 便利性权重+15%（恶劣天气下配送效率更重要）")
        elif temperature <= 10:
            environment_summary.append(f"{weather_condition} {temperature}°C（寒冷）")
            reasoning_parts.append(f"当前温度仅{temperature}°C，为您优选火锅、热汤等暖身热食")
            weight_explanations.append("⚖️ 热食类权重+12%（低温天气暖身需求上升）")
        elif temperature >= 30:
            environment_summary.append(f"{weather_condition} {temperature}°C（炎热）")
            reasoning_parts.append(f"今天{temperature}°C高温天气，为您推荐清爽开胃的餐厅")
            weight_explanations.append("⚖️ 清凉类权重+10%（高温天气清爽食物更受欢迎）")
        elif weather_condition in ["小雨", "阴"]:
            environment_summary.append(f"🌤️ {weather_condition} {temperature}°C")
            reasoning_parts.append("阴雨天气，为您推荐暖心美食")
        else:
            environment_summary.append(f"{weather_condition} {temperature}°C")
        
        # 交通描述
        if congestion_index > 1.8 or congestion_level in ["严重拥堵", "拥堵"]:
            environment_summary.append(f"交通{congestion_level}")
            reasoning_parts.append(f"当前道路{congestion_level}（指数{congestion_index:.1f}），已优先筛选近距离餐厅确保配送时效")
            weight_explanations.append(f"⚖️ 距离权重+{int((congestion_index-1)*10)}%（交通拥堵需缩短配送距离）")
        elif congestion_index > 1.3:
            environment_summary.append("交通略堵")
            reasoning_parts.append("交通略有拥堵，已适当调整配送时间预估")
        else:
            environment_summary.append("交通畅通")

        # 时间描述
        period_names = {
            "breakfast": "早餐",
            "lunch": "午餐",
            "dinner": "晚餐",
            "afternoon_tea": "下午茶",
            "night_snack": "夜宵"
        }
        period_name = period_names.get(meal_period, "用餐")
        
        if is_holiday or festival:
            environment_summary.append(f"🎉 {festival or '假日'} {period_name}时段")
            reasoning_parts.append(f"今天是{festival or '假日'}，{period_name}时段为您精选适合聚餐放松的餐厅")
            weight_explanations.append("⚖️ 相关性权重+8%（节日用餐体验更重要）")
        elif is_weekend:
            environment_summary.append(f"🎊 周末 {period_name}时段")
            reasoning_parts.append(f"周末{period_name}时光，为您推荐适合休闲享用的餐厅")
        else:
            environment_summary.append(f"📅 工作日 {period_name}时段")
            if meal_period == "lunch":
                reasoning_parts.append("工作日午餐时段，为您优选出餐快、性价比高的餐厅")

        # 🆕 健康状态因素（OPPO健康SDK）
        health_ctx = context_analysis.get("health_context", {})
        if health_ctx:
            # 运动状态
            if health_ctx.get("is_post_workout", False):
                environment_summary.append("🏃 运动后")
                reasoning_parts.append("检测到您刚运动完毕，为您推荐富含蛋白质、清淡易消化的健康餐食")
                weight_explanations.append("⚖️ 健康食物权重+22%（运动后需补充蛋白质和能量）")

            # 压力状态
            pressure_value = health_ctx.get("pressure_value", 50)
            pressure_level = health_ctx.get("pressure_level", "正常")
            if pressure_value >= 70 or pressure_level in ["偏高", "中等"]:
                environment_summary.append(f"😰 压力{pressure_level}")
                reasoning_parts.append(f"检测到您当前压力偏高（{pressure_value}分），为您推荐舒缓心情的治愈系美食")
                weight_explanations.append("⚖️ 治愈系食物权重+18%（高压状态需舒缓放松）")

            # 睡眠状态
            sleep_hours = health_ctx.get("last_sleep_duration_hours", 0)
            sleep_quality = health_ctx.get("sleep_quality", "无数据")
            if sleep_hours < 6 or sleep_quality == "较差":
                environment_summary.append(f"😴 睡眠{sleep_hours:.1f}h")
                reasoning_parts.append(f"检测到您昨晚睡眠不足（{sleep_hours:.1f}小时），为您推荐提神补充能量的餐食")
                weight_explanations.append("⚖️ 能量补充类权重+15%（睡眠不足需提神醒脑）")

            # 活动量
            daily_steps = health_ctx.get("daily_steps", 0)
            if daily_steps >= 10000:
                environment_summary.append(f"🚶 {daily_steps}步")
                reasoning_parts.append(f"今日步数已达{daily_steps}步，运动量较大，为您推荐能量补充类餐食")
                weight_explanations.append("⚖️ 高热量营养餐权重+12%（高活动量需补充能量）")
            elif daily_steps < 2000 and health_ctx.get("activity_level") in ["久坐", "轻度"]:
                reasoning_parts.append("今日活动量较少，为您推荐清淡、低热量的健康餐食")
                weight_explanations.append("⚖️ 清淡低热量权重+10%（久坐状态建议清淡饮食）")

            # 血氧状态
            blood_oxygen = health_ctx.get("blood_oxygen", 98)
            blood_oxygen_status = health_ctx.get("blood_oxygen_status", "正常")
            if blood_oxygen < 95 or blood_oxygen_status in ["偏低", "低氧"]:
                reasoning_parts.append(f"检测到血氧偏低（{blood_oxygen}%），为您推荐清淡易消化、富含铁质的健康餐食")
                weight_explanations.append("⚖️ 健康清淡权重+15%（血氧偏低需注意饮食）")

            # 综合健康状态
            overall_health = health_ctx.get("overall_health_status", "无数据")
            if overall_health == "需关注":
                reasoning_parts.append("综合健康状态需关注，已为您严格筛选健康营养的餐食选项")
                weight_explanations.append("⚖️ 健康餐权重+20%（健康状态需关注，优先健康饮食）")

        # 用户行为历史因素
        if profile.get("cuisine_order_frequency"):
            top_cuisines = sorted(profile["cuisine_order_frequency"].items(),
                                   key=lambda x: x[1], reverse=True)[:2]
            if top_cuisines:
                cuisine_str = "、".join([c[0] for c in top_cuisines])
                reasoning_parts.append(f"结合您的历史偏好（常点{cuisine_str}）进行个性化匹配")
                weight_explanations.append("⚖️ 菜系匹配权重基于历史订单动态调整")

        # 浏览历史因素
        if profile.get("browse_interest"):
            browse_cuisines = sorted(profile["browse_interest"].items(), 
                                      key=lambda x: x[1], reverse=True)[:2]
            if browse_cuisines:
                cuisine_str = "、".join([c[0] for c in browse_cuisines])
                reasoning_parts.append(f"发现您近期对{cuisine_str}类餐厅有兴趣")

        # 用户意图
        keywords = intent.get("detected_keywords", [])
        if keywords:
            keyword_str = "、".join([kw.get("value", "") for kw in keywords[:3]])
            reasoning_parts.append(f"根据您的需求「{keyword_str}」进行精准匹配")

        # 用户分群调整
        user_segment = profile.get("user_segment", "standard")
        segment_notes = {
            "premium": "⚖️ 品质优先：质量权重+10%（高端用户更注重品质）",
            "budget": "⚖️ 性价比优先：价值权重+15%（根据您的消费习惯调整）",
        }
        if user_segment in segment_notes:
            weight_explanations.append(segment_notes[user_segment])

        # 组合推荐摘要
        reasoning = f"🤖 **智能推荐** | {' | '.join(environment_summary)}\n\n"
        
        if reasoning_parts:
            reasoning += "📋 **推荐策略**：\n• " + "\n• ".join(reasoning_parts)
        else:
            reasoning += "📋 基于您的位置和偏好，为您精选以下餐厅。"

        # 添加权重调整解释
        if weight_explanations:
            reasoning += "\n\n📊 **智能权重调节**：\n" + "\n".join(weight_explanations)

        # 添加Top餐厅说明
        if recommendations:
            top = recommendations[0]
            features = top.get('features', {})
            score = top.get('score', 85)
            distance = features.get('distance', 1000) or 1000
            rating = features.get('rating', 4.0) or 4.0
            reasoning += f"\n\n💡 **首选推荐**「{top['name']}」：综合评分{score:.0f}分，{rating}分好评，距您约{distance}米。"

        return reasoning

    def _calculate_confidence(self, recommendations: List[Dict[str, Any]],
                             context_analysis: Dict[str, Any],
                             profile_analysis: Dict[str, Any]) -> float:
        """计算置信度"""
        if not recommendations:
            return 0.0
        
        confidence = 0.7  # 基础置信度
        
        # 数据完整性加分
        if context_analysis.get("weather"):
            confidence += 0.05
        if context_analysis.get("traffic"):
            confidence += 0.05
        if profile_analysis.get("profile"):
            confidence += 0.05
        
        # 历史数据加分
        top_arm = self._arms_history.get(recommendations[0]["restaurant_id"])
        if top_arm and top_arm.pulls > 10:
            confidence += 0.05
        
        # 推荐数量
        if len(recommendations) >= 5:
            confidence += 0.05
        
        return min(0.95, confidence)
    
    async def _make_decision_handler(self, restaurants: List[Dict], 
                                     context: Dict = None,
                                     top_k: int = 10) -> Dict[str, Any]:
        """推荐决策处理器"""
        arms = self._restaurants_to_arms(restaurants)
        ranked = self.strategy.rank_all(arms, context)
        return self._arms_to_recommendations(ranked[:top_k], context or {})
    
    async def _update_reward_handler(self, restaurant_id: str, 
                                     reward: float) -> Dict[str, Any]:
        """更新奖励处理器"""
        if restaurant_id in self._arms_history:
            arm = self._arms_history[restaurant_id]
            arm.pulls += 1
            arm.rewards += reward
            return {
                "success": True,
                "restaurant_id": restaurant_id,
                "new_average_reward": arm.average_reward
            }
        return {
            "success": False,
            "error": f"Restaurant {restaurant_id} not found in history"
        }
    
    def update_reward(self, restaurant_id: str, reward: float):
        """更新餐厅奖励（用于在线学习）"""
        if restaurant_id in self._arms_history:
            arm = self._arms_history[restaurant_id]
            arm.pulls += 1
            arm.rewards += reward
            logger.debug(f"Updated reward for {restaurant_id}: {arm.average_reward:.3f}")
            
            # 📦 异步记录反馈数据（用于 ML 模型训练）
            if ML_AVAILABLE:
                try:
                    collector = get_data_collector()
                    feedback_type = "click" if reward <= 0.3 else ("order" if reward >= 1.0 else "rating")
                    import asyncio
                    try:
                        loop = asyncio.get_running_loop()
                        loop.create_task(
                            collector.log_feedback(
                                restaurant_id=restaurant_id,
                                feedback_type=feedback_type,
                                reward_value=reward,
                            )
                        )
                    except RuntimeError:
                        pass  # 非异步上下文，跳过
                except Exception as e:
                    logger.debug(f"反馈数据记录失败（不影响奖励更新）: {e}")
    
    def set_strategy(self, strategy: str):
        """动态切换 MAB 策略"""
        self.strategy_name = strategy
        self.strategy = self._create_strategy(strategy)
        logger.info(f"Switched to {strategy} strategy")


# 工厂函数
def create_decision_agent(strategy: str = "contextual", 
                         llm_client=None) -> DecisionAgent:
    """创建决策智能体实例"""
    return DecisionAgent(strategy, llm_client)