"""
Neural Collaborative Filtering(NCF)交互层模型

架构: GMF+MLP双路径融合(He et al., WWW 2017)
创新: 使用FoodCF-Encoder语义嵌入替代传统ID Embedding

    ┌─────────────┐    ┌──────────────────┐
    │ User Embed   │    │ Restaurant Embed │
    │  (128d)      │    │   (128d)         │
    └──────┬──────┘    └───────┬──────────┘
           │                    │
    ┌──────┴────────────────────┴──────────┐
    │                                       │
    │  ┌─────────┐       ┌──────────────┐  │
    │  │  GMF     │       │   MLP        │  │
    │  │ u ⊙ r   │       │ [u;r]→512    │  │
    │  │  (128d)  │       │ →256→128     │  │
    │  └────┬────┘       └──────┬───────┘  │
    │       │                    │          │
    │       └──────┬─────────────┘          │
    │              │ concat                 │
    │       ┌──────▼──────┐                 │
    │       │  Final MLP  │                 │
    │       │  → sigmoid  │                 │
    │       └──────┬──────┘                 │
    │              │                        │
    │        score ∈ [0,1]                  │
    └───────────────────────────────────────┘
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(ROOT_DIR, "models")

# 默认NCF模型路径
NCF_MODEL_PATH = os.path.join(MODEL_DIR, "ncf_model.pth")


def _build_ncf_model(embed_dim: int = 128):
    """构建 NCF PyTorch 模型"""
    import torch
    import torch.nn as nn

    class NCFModel(nn.Module):
        """
        Neural Collaborative Filtering

        双路径:
          - GMF(Generalized Matrix Factorization)：element-wise product
          - MLP：拼接后多层全连接
        """

        def __init__(self, embed_dim: int = 128, mlp_hidden: Tuple[int, ...] = (512, 256, 128)):
            super().__init__()
            self.embed_dim = embed_dim

            # MLP路径
            mlp_layers = []
            prev_dim = embed_dim * 2  # user + restaurant concat
            for hidden in mlp_hidden:
                mlp_layers.append(nn.Linear(prev_dim, hidden))
                mlp_layers.append(nn.BatchNorm1d(hidden))
                mlp_layers.append(nn.ReLU())
                mlp_layers.append(nn.Dropout(0.2))
                prev_dim = hidden
            self.mlp = nn.Sequential(*mlp_layers)

            # 最终融合层：GMF output(embed_dim) + MLP output(last hidden)
            self.final = nn.Sequential(
                nn.Linear(embed_dim + mlp_hidden[-1], 64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, 1),
                nn.Sigmoid(),
            )

        def forward(
            self, user_embed: "torch.Tensor", restaurant_embed: "torch.Tensor"
        ) -> "torch.Tensor":
            """
            Args:
                user_embed: (batch, embed_dim)
                restaurant_embed: (batch, embed_dim)
            Returns:
                scores: (batch,)  交互概率
            """
            # GMF路径：element-wise product
            gmf_out = user_embed * restaurant_embed  # (batch, embed_dim)

            # MLP路径：拼接后多层全连接
            mlp_input = torch.cat([user_embed, restaurant_embed], dim=1)  # (batch, embed_dim*2)
            mlp_out = self.mlp(mlp_input)  # (batch, last_hidden)

            # 融合
            combined = torch.cat([gmf_out, mlp_out], dim=1)
            scores = self.final(combined).squeeze(1)  # (batch,)
            return scores

    return NCFModel(embed_dim=embed_dim)


class NCFInferenceEngine:
    """
    NCF 推理引擎

    加载训练好的NCF模型，提供用户-餐厅交互分数预测。
    如果模型不存在，降级为余弦相似度计算。
    """

    def __init__(self, model_path: Optional[str] = None, embed_dim: int = 128):
        self.model_path = model_path or NCF_MODEL_PATH
        self.embed_dim = embed_dim
        self._model = None
        self._loaded = False
        self._mode = "unknown"  # "ncf" | "cosine_fallback"

    def _load_model(self):
        """懒加载NCF模型"""
        if self._loaded:
            return

        if os.path.exists(self.model_path):
            try:
                import torch

                checkpoint = torch.load(self.model_path, map_location="cpu", weights_only=False)
                self._model = _build_ncf_model(embed_dim=checkpoint.get("embed_dim", self.embed_dim))
                self._model.load_state_dict(checkpoint["state_dict"])
                self._model.eval()
                self._mode = "ncf"
                logger.info(f"✅ NCF 模型加载成功: {self.model_path}")
            except Exception as e:
                logger.warning(f"⚠️ NCF 模型加载失败，降级为余弦相似度: {e}")
                self._mode = "cosine_fallback"
        else:
            logger.info("ℹ️ NCF 模型文件不存在，使用余弦相似度降级模式")
            self._mode = "cosine_fallback"

        self._loaded = True

    def predict(
        self,
        user_embedding: np.ndarray,
        restaurant_embeddings: np.ndarray,
    ) -> np.ndarray:
        """
        批量预测用户-餐厅交互分数

        Args:
            user_embedding: (embed_dim,) 用户嵌入
            restaurant_embeddings: (n, embed_dim) 餐厅嵌入矩阵

        Returns:
            (n,) 交互分数数组，值域 [0, 1]
        """
        self._load_model()

        n = restaurant_embeddings.shape[0]
        if n == 0:
            return np.array([], dtype=np.float32)

        if self._mode == "ncf" and self._model is not None:
            return self._predict_ncf(user_embedding, restaurant_embeddings)
        else:
            return self._predict_cosine(user_embedding, restaurant_embeddings)

    def _predict_ncf(
        self, user_embedding: np.ndarray, restaurant_embeddings: np.ndarray
    ) -> np.ndarray:
        """使用NCF模型预测"""
        import torch

        n = restaurant_embeddings.shape[0]
        user_tensor = torch.from_numpy(
            np.tile(user_embedding, (n, 1)).astype(np.float32)
        )
        rest_tensor = torch.from_numpy(restaurant_embeddings.astype(np.float32))

        with torch.no_grad():
            scores = self._model(user_tensor, rest_tensor).numpy()

        return scores.astype(np.float32)

    def _predict_cosine(
        self, user_embedding: np.ndarray, restaurant_embeddings: np.ndarray
    ) -> np.ndarray:
        """余弦相似度降级，即L2归一化后的点积"""
        # 假设嵌入已L2归一化
        scores = restaurant_embeddings @ user_embedding
        # 映射[-1, 1] → [0, 1]
        scores = (scores + 1.0) / 2.0
        return scores.astype(np.float32)

    def is_available(self) -> bool:
        """引擎是否可用，包括降级模式"""
        self._load_model()
        return True

    @property
    def mode(self) -> str:
        self._load_model()
        return self._mode


# ============================================================
# 单例
# ============================================================

_ncf_engine: Optional[NCFInferenceEngine] = None


def get_ncf_engine(
    model_path: Optional[str] = None, embed_dim: int = 128
) -> NCFInferenceEngine:
    """获取NCF推理引擎单例"""
    global _ncf_engine
    if _ncf_engine is None:
        _ncf_engine = NCFInferenceEngine(model_path=model_path, embed_dim=embed_dim)
    return _ncf_engine
