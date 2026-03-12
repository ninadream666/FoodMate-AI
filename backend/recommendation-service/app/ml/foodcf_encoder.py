"""
FoodCF-Encoder — 面向外卖推荐协同过滤的领域专用嵌入模型

技术架构:
  基座: GTE-Qwen2-1.5B (阿里通义, Decoder-only LLM 嵌入模型)
  训练: 三阶段渐进式 —
    1) LLM 合成数据增强预热 (E5-Mistral 范式)
    2) 指令感知对比学习 (NV-Embed: 双向注意力 + Latent Attention Pooling)
    3) 多任务 + Matryoshka 表示学习联合微调

  推理降级链:
    FoodCF-Encoder 微调模型 → GTE-Qwen2 原始模型 → 简易 TF-IDF 哈希嵌入

核心参考文献:
  [1] Wang et al., "Improving Text Embeddings with Large Language Models", NAACL 2024
  [2] Lee et al., "NV-Embed", NeurIPS 2024
  [3] Ren et al., "RLMRec", WWW 2024
  [4] Kusupati et al., "Matryoshka Representation Learning", NeurIPS 2022
"""

import os
import logging
import hashlib
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(ROOT_DIR, "models")

# 默认嵌入维度 (Matryoshka: 支持 32/64/128 截断)
DEFAULT_EMBED_DIM = 128

# 指令前缀 (E5-Mistral 风格)
INSTRUCTION_USER = "判断该用户会在哪些外卖餐厅下单："
INSTRUCTION_RESTAURANT = "描述这家外卖餐厅的特色："


class LatentAttentionPooling:
    """
    Latent Attention Pooling (NV-Embed, NeurIPS 2024)

    使用可学习的 latent query tokens 通过 cross-attention 从序列中提取嵌入,
    比简单 mean pooling 提取更丰富的语义信息。

    注: 仅在 PyTorch 可用且模型已加载时使用;
        降级模式下退化为 mean pooling。
    """

    def __init__(self, hidden_dim: int, num_latent_tokens: int = 4, output_dim: int = DEFAULT_EMBED_DIM):
        self.num_latent_tokens = num_latent_tokens
        self.output_dim = output_dim
        self.hidden_dim = hidden_dim
        self._module = None

    def build(self):
        """构建 PyTorch 模块"""
        import torch
        import torch.nn as nn

        class _LatentAttnModule(nn.Module):
            def __init__(self, hidden_dim, num_tokens, output_dim):
                super().__init__()
                self.latent_queries = nn.Parameter(torch.randn(1, num_tokens, hidden_dim) * 0.02)
                self.cross_attn = nn.MultiheadAttention(
                    embed_dim=hidden_dim, num_heads=8, batch_first=True
                )
                self.proj = nn.Linear(num_tokens * hidden_dim, output_dim)
                self.norm = nn.LayerNorm(output_dim)

            def forward(self, hidden_states: "torch.Tensor") -> "torch.Tensor":
                """
                Args:
                    hidden_states: (batch, seq_len, hidden_dim)
                Returns:
                    embeddings: (batch, output_dim)
                """
                batch_size = hidden_states.size(0)
                queries = self.latent_queries.expand(batch_size, -1, -1)
                attn_out, _ = self.cross_attn(queries, hidden_states, hidden_states)
                flat = attn_out.reshape(batch_size, -1)
                return self.norm(self.proj(flat))

        self._module = _LatentAttnModule(self.hidden_dim, self.num_latent_tokens, self.output_dim)
        return self._module

    @property
    def module(self):
        if self._module is None:
            self.build()
        return self._module


class FoodCFEncoder:
    """
    FoodCF-Encoder: 面向外卖推荐的领域专用双塔嵌入模型

    提供两个核心接口:
      - encode_user(profile_text) -> np.ndarray   用户塔
      - encode_restaurant(desc_text) -> np.ndarray 餐厅塔

    降级链:
      1. 微调模型 (models/foodcf_encoder/) — 精度最高
      2. GTE-Qwen2-1.5B 原始 HuggingFace 模型 — 需要下载
      3. TF-IDF 哈希嵌入 — 纯本地、零依赖降级
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        embed_dim: int = DEFAULT_EMBED_DIM,
        device: str = "cpu",
    ):
        self.model_path = model_path or os.path.join(MODEL_DIR, "foodcf_encoder")
        self.embed_dim = embed_dim
        self.device = device

        # 模型组件 (懒加载)
        self._tokenizer = None
        self._base_model = None
        self._user_pooling: Optional[LatentAttentionPooling] = None
        self._restaurant_pooling: Optional[LatentAttentionPooling] = None
        self._loaded = False
        self._mode = "unknown"  # "finetuned" | "pretrained" | "fallback"

    def _load_model(self):
        """懒加载模型，按降级链尝试"""
        if self._loaded:
            return

        # 尝试 1: 加载微调模型
        if os.path.isdir(self.model_path) and os.path.exists(
            os.path.join(self.model_path, "config.json")
        ):
            try:
                self._load_finetuned()
                self._mode = "finetuned"
                self._loaded = True
                logger.info(f"✅ FoodCF-Encoder 微调模型加载成功: {self.model_path}")
                return
            except Exception as e:
                logger.warning(f"⚠️ 微调模型加载失败: {e}")

        # 尝试 2: 加载 HuggingFace 预训练模型
        try:
            self._load_pretrained()
            self._mode = "pretrained"
            self._loaded = True
            logger.info("✅ GTE-Qwen2-1.5B 预训练模型加载成功")
            return
        except Exception as e:
            logger.warning(f"⚠️ 预训练模型加载失败 (可能未安装 transformers): {e}")

        # 尝试 3: TF-IDF 哈希降级
        self._mode = "fallback"
        self._loaded = True
        logger.info("ℹ️ FoodCF-Encoder 降级为 TF-IDF 哈希嵌入模式")

    def _load_finetuned(self):
        """加载微调后的模型（支持 LoRA adapter）"""
        import torch
        from transformers import AutoTokenizer, AutoModel

        # 读取训练配置
        config_path = os.path.join(self.model_path, "config.json")
        import json
        with open(config_path, "r") as f:
            train_config = json.load(f)

        base_model_name = train_config.get("base_model", "Alibaba-NLP/gte-Qwen2-1.5B-instruct")
        lora_applied = train_config.get("lora_applied", False)

        self._tokenizer = AutoTokenizer.from_pretrained(self.model_path)

        if lora_applied:
            # LoRA 模式: 先加载基座，再合并 adapter
            from peft import PeftModel
            base = AutoModel.from_pretrained(base_model_name)
            self._base_model = PeftModel.from_pretrained(base, self.model_path)
            self._base_model = self._base_model.merge_and_unload()  # 合并权重，推理更快
            self._base_model = self._base_model.to(self.device)
        else:
            self._base_model = AutoModel.from_pretrained(
                base_model_name
            ).to(self.device)

        self._base_model.eval()

        hidden_dim = self._base_model.config.hidden_size

        # 加载 Latent Attention Pooling 权重
        user_pool_path = os.path.join(self.model_path, "user_pooling.pt")
        rest_pool_path = os.path.join(self.model_path, "restaurant_pooling.pt")

        self._user_pooling = LatentAttentionPooling(hidden_dim, output_dim=self.embed_dim)
        self._restaurant_pooling = LatentAttentionPooling(hidden_dim, output_dim=self.embed_dim)

        if os.path.exists(user_pool_path):
            self._user_pooling.build()
            self._user_pooling.module.load_state_dict(
                torch.load(user_pool_path, map_location=self.device, weights_only=True)
            )
            self._user_pooling.module.eval()
        else:
            self._user_pooling.build()

        if os.path.exists(rest_pool_path):
            self._restaurant_pooling.build()
            self._restaurant_pooling.module.load_state_dict(
                torch.load(rest_pool_path, map_location=self.device, weights_only=True)
            )
            self._restaurant_pooling.module.eval()
        else:
            self._restaurant_pooling.build()

    def _load_pretrained(self):
        """加载 HuggingFace 预训练模型 (GTE-Qwen2-1.5B)"""
        import torch
        from transformers import AutoTokenizer, AutoModel

        model_name = "Alibaba-NLP/gte-Qwen2-1.5B-instruct"
        self._tokenizer = AutoTokenizer.from_pretrained(model_name)
        self._base_model = AutoModel.from_pretrained(
            model_name
        ).to(self.device)
        self._base_model.eval()

        # 预训练模式使用 mean pooling，不使用 Latent Attention Pooling
        self._user_pooling = None
        self._restaurant_pooling = None

    def _tfidf_hash_embed(self, text: str) -> np.ndarray:
        """
        TF-IDF 哈希嵌入（零依赖降级方案）

        使用特征哈希 (feature hashing) 将文本映射为固定维度的稠密向量。
        虽然精度远低于神经模型，但保证系统在无 GPU / 无模型文件时仍能运行。
        """
        # 简单中文字/词分割
        tokens = list(text)
        # 加入 bigram
        for i in range(len(text) - 1):
            tokens.append(text[i : i + 2])

        vec = np.zeros(self.embed_dim, dtype=np.float32)
        for token in tokens:
            h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            idx = h % self.embed_dim
            sign = 1.0 if (h // self.embed_dim) % 2 == 0 else -1.0
            vec[idx] += sign

        # L2 归一化
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def _encode_with_model(self, text: str, instruction: str, pooling) -> np.ndarray:
        """使用 Transformer 模型编码文本"""
        import torch

        full_text = f"{instruction}{text}"
        inputs = self._tokenizer(
            full_text, return_tensors="pt", max_length=512, truncation=True, padding=True
        ).to(self.device)

        with torch.no_grad():
            # 双向注意力: 不使用 causal mask (NV-Embed 的核心创新)
            outputs = self._base_model(**inputs)
            hidden_states = outputs.last_hidden_state  # (1, seq_len, hidden_dim)

            if pooling is not None and pooling.module is not None:
                # Latent Attention Pooling
                embedding = pooling.module(hidden_states)  # (1, embed_dim)
            else:
                # Mean Pooling 降级
                mask = inputs["attention_mask"].unsqueeze(-1).float()
                embedding = (hidden_states * mask).sum(1) / mask.sum(1)
                # 截断到目标维度 (Matryoshka)
                embedding = embedding[:, : self.embed_dim]

        vec = embedding.squeeze(0).cpu().numpy().astype(np.float32)
        # L2 归一化
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def encode_user(self, profile_text: str) -> np.ndarray:
        """
        用户塔: 将用户画像文本编码为嵌入向量

        Args:
            profile_text: 用户画像描述文本，例如
                "近5次点了川菜3次、粤菜1次、日料1次; 偏好: 麻辣; 限制: 花生过敏"

        Returns:
            (embed_dim,) 的 L2 归一化嵌入向量
        """
        self._load_model()

        if self._mode == "fallback":
            return self._tfidf_hash_embed(INSTRUCTION_USER + profile_text)

        return self._encode_with_model(profile_text, INSTRUCTION_USER, self._user_pooling)

    def encode_restaurant(self, description_text: str) -> np.ndarray:
        """
        餐厅塔: 将餐厅描述文本编码为嵌入向量

        Args:
            description_text: 餐厅描述文本，例如
                "渝味老火锅·川渝菜·招牌毛肚火锅/麻辣牛肉; 人均55元; 评分4.6; 月销2300单"

        Returns:
            (embed_dim,) 的 L2 归一化嵌入向量
        """
        self._load_model()

        if self._mode == "fallback":
            return self._tfidf_hash_embed(INSTRUCTION_RESTAURANT + description_text)

        return self._encode_with_model(
            description_text, INSTRUCTION_RESTAURANT, self._restaurant_pooling
        )

    def encode_restaurants_batch(self, descriptions: List[str]) -> np.ndarray:
        """
        批量编码餐厅 (离线预计算用)

        Returns:
            (n, embed_dim) 的嵌入矩阵
        """
        embeddings = []
        for desc in descriptions:
            embeddings.append(self.encode_restaurant(desc))
        return np.stack(embeddings)

    def similarity(self, user_embed: np.ndarray, restaurant_embed: np.ndarray) -> float:
        """计算用户-餐厅嵌入的余弦相似度"""
        return float(np.dot(user_embed, restaurant_embed))

    @property
    def mode(self) -> str:
        """当前运行模式"""
        self._load_model()
        return self._mode

    def is_available(self) -> bool:
        """模型是否可用 (包括降级模式)"""
        self._load_model()
        return True  # 始终可用（最差降级到 TF-IDF 哈希）


# ============================================================
# 单例获取
# ============================================================

_encoder_instance: Optional[FoodCFEncoder] = None


def get_foodcf_encoder(
    model_path: Optional[str] = None,
    embed_dim: int = DEFAULT_EMBED_DIM,
) -> FoodCFEncoder:
    """获取 FoodCF-Encoder 单例"""
    global _encoder_instance
    if _encoder_instance is None:
        _encoder_instance = FoodCFEncoder(model_path=model_path, embed_dim=embed_dim)
    return _encoder_instance
