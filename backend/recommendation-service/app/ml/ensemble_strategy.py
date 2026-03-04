"""
EnsembleMLStrategy — MABStrategy 子类

在 DecisionAgent 的策略工厂中注册为 "ml_ensemble"，
调用 LightGBM + DeepFM Ensemble 推理引擎进行排序。

降级逻辑:
  模型可用 → ML Ensemble 排序
  模型不可用 → 自动降级到 ContextualBanditStrategy（规则排序）
"""

import logging
from typing import Dict, Any, List, Optional

from .feature_engineering import extract_features
from .inference_engine import EnsembleInferenceEngine, get_inference_engine

logger = logging.getLogger(__name__)


class EnsembleMLStrategy:
    """
    LightGBM + DeepFM 融合排序策略

    实现与 MABStrategy 相同的接口:
      - select(arms, context) -> RestaurantArm
      - rank_all(arms, context) -> List[RestaurantArm]
    """

    def __init__(
        self,
        lgb_weight: float = 0.6,
        deepfm_weight: float = 0.4,
        fallback_strategy=None,
    ):
        """
        Parameters
        ----------
        lgb_weight : float
            LightGBM 在 ensemble 中的权重
        deepfm_weight : float
            DeepFM 在 ensemble 中的权重
        fallback_strategy : MABStrategy | None
            模型不可用时的降级策略（默认为 ContextualBanditStrategy）
        """
        self.engine: EnsembleInferenceEngine = get_inference_engine(lgb_weight, deepfm_weight)
        self.fallback_strategy = fallback_strategy
        self._name = "ml_ensemble"

    def select(self, arms, context: Dict[str, Any] = None):
        """选择最优 arm"""
        ranked = self.rank_all(arms, context)
        return ranked[0] if ranked else None

    def rank_all(self, arms, context: Dict[str, Any] = None):
        """
        对所有 arm 排序（核心方法）

        1. 将每个 arm 提取为统一特征
        2. 调用 Ensemble 推理引擎批量打分
        3. 按分数降序排序
        4. 模型失败时降级到 fallback_strategy
        """
        if not arms:
            return []

        context = context or {}

        # 提取特征
        feature_dicts = []
        for arm in arms:
            fd = extract_features(
                arm_features=arm.features,
                context=context,
                mab_pulls=arm.pulls,
                mab_avg_reward=arm.average_reward,
            )
            # 补充 name 字段供意图匹配
            fd["_name"] = arm.name
            feature_dicts.append(fd)

        # ML 推理
        scores = self.engine.predict(feature_dicts)

        if scores is None:
            # 模型不可用，降级
            logger.warning("⚠️ ML Ensemble 不可用，降级到规则策略")
            if self.fallback_strategy:
                return self.fallback_strategy.rank_all(arms, context)
            # 无 fallback，按 average_reward 排序
            return sorted(arms, key=lambda a: a.average_reward, reverse=True)

        # 将分数绑定到 arm 上（注入 _ml_score 便于后续 _calculate_display_score 使用）
        arm_score_pairs = list(zip(arms, scores))

        # 按分数降序排列
        arm_score_pairs.sort(key=lambda x: x[1], reverse=True)

        sorted_arms = []
        for arm, score in arm_score_pairs:
            # 将 ML 分数存入 features 供展示层使用
            arm.features["_ml_score"] = score
            sorted_arms.append(arm)

        logger.info(
            f"🤖 ML Ensemble 排序完成: "
            f"top={sorted_arms[0].name if sorted_arms else 'N/A'} "
            f"score={arm_score_pairs[0][1]:.4f}" if arm_score_pairs else ""
        )

        return sorted_arms

    def get_status(self) -> Dict[str, Any]:
        """返回策略状态"""
        return {
            "strategy": self._name,
            "engine": self.engine.get_status(),
            "fallback": type(self.fallback_strategy).__name__ if self.fallback_strategy else None,
        }
