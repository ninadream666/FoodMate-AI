"""
ML 推理引擎

加载训练好的 LightGBM + DeepFM 模型，提供 Ensemble 推理能力。
在 DecisionAgent 排序阶段被 EnsembleMLStrategy 调用。

设计:
- 懒加载：首次 predict 时才真正加载模型文件
- 降级机制：某个模型加载失败时仅用另一个；两个都失败则返回 None（交由策略层降级到规则）
- 线程安全：模型推理本身是无状态的，无需额外锁
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from .feature_engineering import (
    ALL_NUMERIC, CATEGORICAL_FEATURES,
    extract_features,
)

logger = logging.getLogger(__name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(ROOT_DIR, "models")


class EnsembleInferenceEngine:
    """
    LightGBM + DeepFM 双模型 Ensemble 推理引擎

    predict(arms, context) -> List[float]  返回每个 arm 的融合分数
    """

    def __init__(
        self,
        lgb_model_path: Optional[str] = None,
        deepfm_model_path: Optional[str] = None,
        lgb_weight: float = 0.6,
        deepfm_weight: float = 0.4,
    ):
        """
        Parameters
        ----------
        lgb_model_path : str
            LightGBM 模型文件路径，默认 models/lightgbm_ranking.txt
        deepfm_model_path : str
            DeepFM 模型文件路径，默认 models/deepfm_ranking.pth
        lgb_weight : float
            LightGBM 在 ensemble 中的权重（默认 0.6）
        deepfm_weight : float
            DeepFM 在 ensemble 中的权重（默认 0.4）
        """
        self.lgb_model_path = lgb_model_path or os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
        self.deepfm_model_path = deepfm_model_path or os.path.join(MODEL_DIR, "deepfm_ranking.pth")
        self.lgb_weight = lgb_weight
        self.deepfm_weight = deepfm_weight

        # 模型实例（懒加载）
        self._lgb_model = None
        self._deepfm_model = None
        self._deepfm_encoders = None
        self._deepfm_dims = None
        self._loaded = False

    def _load_models(self):
        """懒加载模型"""
        if self._loaded:
            return

        # --- LightGBM ---
        if os.path.exists(self.lgb_model_path):
            try:
                import lightgbm as lgb
                self._lgb_model = lgb.Booster(model_file=self.lgb_model_path)
                logger.info(f"✅ LightGBM 模型加载成功: {self.lgb_model_path}")
            except Exception as e:
                logger.warning(f"⚠️ LightGBM 模型加载失败: {e}")
                self._lgb_model = None
        else:
            logger.info(f"ℹ️ LightGBM 模型文件不存在: {self.lgb_model_path}")

        # --- DeepFM ---
        if os.path.exists(self.deepfm_model_path):
            try:
                import torch
                from .train_deepfm import DeepFM
                checkpoint = torch.load(self.deepfm_model_path, map_location="cpu", weights_only=False)
                self._deepfm_encoders = checkpoint["encoders"]
                self._deepfm_dims = checkpoint["dims"]
                model = DeepFM(
                    num_numeric=checkpoint["num_numeric"],
                    sparse_feature_dims=checkpoint["dims"],
                    embedding_dim=checkpoint.get("embedding_dim", 8),
                )
                model.load_state_dict(checkpoint["state_dict"])
                model.eval()
                self._deepfm_model = model
                logger.info(f"✅ DeepFM 模型加载成功: {self.deepfm_model_path}")
            except Exception as e:
                logger.warning(f"⚠️ DeepFM 模型加载失败: {e}")
                self._deepfm_model = None
        else:
            logger.info(f"ℹ️ DeepFM 模型文件不存在: {self.deepfm_model_path}")

        self._loaded = True

        if self._lgb_model is None and self._deepfm_model is None:
            logger.warning("⚠️ 两个模型都未加载，Ensemble 引擎将返回 None（降级到规则策略）")

    def is_available(self) -> bool:
        """至少有一个模型可用"""
        self._load_models()
        return self._lgb_model is not None or self._deepfm_model is not None

    def predict(
        self,
        feature_dicts: List[Dict[str, Any]],
    ) -> Optional[List[float]]:
        """
        Ensemble 预测

        Parameters
        ----------
        feature_dicts : list[dict]
            每个元素是 extract_features() 的输出

        Returns
        -------
        list[float] | None
            每个样本的 ensemble 分数 (0~1)，如果两个模型都不可用返回 None
        """
        self._load_models()

        n = len(feature_dicts)
        if n == 0:
            return []

        lgb_scores = None
        deepfm_scores = None

        # --- LightGBM 推理 ---
        if self._lgb_model is not None:
            try:
                lgb_scores = self._predict_lightgbm(feature_dicts)
            except Exception as e:
                logger.warning(f"⚠️ LightGBM 推理失败: {e}")

        # --- DeepFM 推理 ---
        if self._deepfm_model is not None:
            try:
                deepfm_scores = self._predict_deepfm(feature_dicts)
            except Exception as e:
                logger.warning(f"⚠️ DeepFM 推理失败: {e}")

        # --- Ensemble 融合 ---
        if lgb_scores is not None and deepfm_scores is not None:
            # 双模型加权融合
            total_weight = self.lgb_weight + self.deepfm_weight
            scores = [
                (self.lgb_weight * lg + self.deepfm_weight * df) / total_weight
                for lg, df in zip(lgb_scores, deepfm_scores)
            ]
            logger.debug(f"🔀 Ensemble 融合: LGB×{self.lgb_weight} + DeepFM×{self.deepfm_weight}")
        elif lgb_scores is not None:
            scores = lgb_scores
            logger.debug("🌲 仅 LightGBM 推理")
        elif deepfm_scores is not None:
            scores = deepfm_scores
            logger.debug("🧠 仅 DeepFM 推理")
        else:
            return None  # 两个都失败，交由调用者降级

        # 归一化到 0~1
        scores = [max(0.0, min(1.0, s)) for s in scores]
        return scores

    def _predict_lightgbm(self, feature_dicts: List[Dict[str, Any]]) -> List[float]:
        """LightGBM 批量推理"""
        import pandas as pd
        from .feature_engineering import CUISINE_VOCAB, MEAL_PERIOD_VOCAB, USER_SEGMENT_VOCAB, WEATHER_VOCAB

        feature_cols = ALL_NUMERIC + CATEGORICAL_FEATURES
        rows = []
        for fd in feature_dicts:
            row = {}
            for col in ALL_NUMERIC:
                row[col] = float(fd.get(col, 0.0))
            for col in CATEGORICAL_FEATURES:
                row[col] = str(fd.get(col, "unknown"))
            rows.append(row)

        df = pd.DataFrame(rows)

        # 类别特征转 category dtype（与训练时一致）
        cat_vocabs = {
            "cuisine_type": CUISINE_VOCAB + ["其他", "unknown"],
            "meal_period": MEAL_PERIOD_VOCAB + ["unknown"],
            "user_segment": USER_SEGMENT_VOCAB + ["unknown"],
            "weather_condition": WEATHER_VOCAB + ["其他", "unknown"],
        }
        for cat_col in CATEGORICAL_FEATURES:
            vocab = cat_vocabs.get(cat_col, [])
            if vocab:
                df[cat_col] = df[cat_col].apply(lambda x: x if x in vocab else "unknown")
            df[cat_col] = df[cat_col].astype("category")

        preds = self._lgb_model.predict(df[feature_cols])
        return preds.tolist()

    def _predict_deepfm(self, feature_dicts: List[Dict[str, Any]]) -> List[float]:
        """DeepFM 批量推理"""
        import torch

        # 准备 dense tensor
        dense = np.zeros((len(feature_dicts), len(ALL_NUMERIC)), dtype=np.float32)
        for i, fd in enumerate(feature_dicts):
            for j, col in enumerate(ALL_NUMERIC):
                dense[i, j] = float(fd.get(col, 0.0))

        # 准备 sparse tensor
        sparse = np.zeros((len(feature_dicts), len(CATEGORICAL_FEATURES)), dtype=np.int64)
        for i, fd in enumerate(feature_dicts):
            for j, col in enumerate(CATEGORICAL_FEATURES):
                val = str(fd.get(col, "unknown"))
                enc = self._deepfm_encoders.get(col, {})
                sparse[i, j] = enc.get(val, enc.get("unknown", 0))

        dense_tensor = torch.tensor(dense, dtype=torch.float32)
        sparse_tensor = torch.tensor(sparse, dtype=torch.long)

        with torch.no_grad():
            preds = self._deepfm_model(dense_tensor, sparse_tensor)

        return preds.numpy().tolist()

    def get_status(self) -> Dict[str, Any]:
        """返回引擎状态"""
        self._load_models()
        return {
            "lightgbm_loaded": self._lgb_model is not None,
            "deepfm_loaded": self._deepfm_model is not None,
            "lgb_weight": self.lgb_weight,
            "deepfm_weight": self.deepfm_weight,
            "lgb_model_path": self.lgb_model_path,
            "deepfm_model_path": self.deepfm_model_path,
        }


# 全局单例
_engine: Optional[EnsembleInferenceEngine] = None


def get_inference_engine(
    lgb_weight: float = 0.6,
    deepfm_weight: float = 0.4,
) -> EnsembleInferenceEngine:
    """获取全局推理引擎实例"""
    global _engine
    if _engine is None:
        _engine = EnsembleInferenceEngine(lgb_weight=lgb_weight, deepfm_weight=deepfm_weight)
    return _engine
