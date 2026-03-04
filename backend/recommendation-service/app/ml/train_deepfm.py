"""
DeepFM CTR 模型训练脚本

功能:
- 从 training_samples.jsonl 加载数据
- 构建 DeepFM 模型（Wide 线性 + FM 二阶交叉 + Deep DNN）
- 自动学习特征交叉（如"下雨×近距离"、"运动后×高蛋白菜系"）
- 保存模型到 models/deepfm_ranking.pth

用法:
    python -m app.ml.train_deepfm
    python -m app.ml.train_deepfm --epochs 30 --lr 0.001
"""

import os
import sys
import json
import logging
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from collections import OrderedDict

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

from app.ml.feature_engineering import (
    ALL_NUMERIC, CATEGORICAL_FEATURES,
    CUISINE_VOCAB, MEAL_PERIOD_VOCAB, USER_SEGMENT_VOCAB, WEATHER_VOCAB,
)

logger = logging.getLogger(__name__)

DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(ROOT_DIR, "ml_data"))
MODEL_DIR = os.path.join(ROOT_DIR, "models")


# ============================================================
# DeepFM 模型定义
# ============================================================

class DeepFM(nn.Module):
    """
    DeepFM: Wide (线性) + FM (二阶交叉) + Deep (DNN)

    输入:
      - dense_input:  (batch, n_numeric)     连续特征
      - sparse_input: (batch, n_categorical) 类别特征索引
    输出:
      - (batch, 1)  预测的 CTR / 转化概率
    """

    def __init__(
        self,
        num_numeric: int,
        sparse_feature_dims: Dict[str, int],  # {feat_name: vocab_size}
        embedding_dim: int = 8,
        dnn_hidden_units: Tuple[int, ...] = (128, 64, 32),
        dropout: float = 0.2,
    ):
        super().__init__()
        self.num_numeric = num_numeric
        self.sparse_feature_names = list(sparse_feature_dims.keys())
        self.embedding_dim = embedding_dim

        # ========== 一阶 Linear 部分 ==========
        # 连续特征的线性权重
        self.linear_dense = nn.Linear(num_numeric, 1, bias=True)
        # 类别特征的一阶 embedding (每个特征 -> 1维)
        self.linear_sparse_embeddings = nn.ModuleDict({
            name: nn.Embedding(dim, 1, padding_idx=0)
            for name, dim in sparse_feature_dims.items()
        })

        # ========== FM 二阶交叉部分 ==========
        # 类别特征 -> embedding_dim 维
        self.fm_sparse_embeddings = nn.ModuleDict({
            name: nn.Embedding(dim, embedding_dim, padding_idx=0)
            for name, dim in sparse_feature_dims.items()
        })
        # 连续特征也投影到 embedding_dim （可与类别 embedding 做交叉）
        self.fm_dense_proj = nn.Linear(num_numeric, len(sparse_feature_dims) * embedding_dim, bias=False)

        # ========== Deep DNN 部分 ==========
        total_embed_dim = (len(sparse_feature_dims) * 2) * embedding_dim + num_numeric
        layers = []
        prev_dim = total_embed_dim
        for hidden in dnn_hidden_units:
            layers.append(nn.Linear(prev_dim, hidden))
            layers.append(nn.BatchNorm1d(hidden))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev_dim = hidden
        self.dnn = nn.Sequential(*layers)
        self.dnn_output = nn.Linear(prev_dim, 1)

        # ========== 最终融合 ==========
        self.output_layer = nn.Linear(3, 1)  # [linear_out, fm_out, dnn_out] -> 1
        self.sigmoid = nn.Sigmoid()

    def forward(self, dense_input: torch.Tensor, sparse_input: torch.Tensor) -> torch.Tensor:
        batch_size = dense_input.size(0)

        # ===== 1) Linear 部分 =====
        linear_out = self.linear_dense(dense_input)  # (B, 1)
        for i, name in enumerate(self.sparse_feature_names):
            idx = sparse_input[:, i]  # (B,)
            linear_out = linear_out + self.linear_sparse_embeddings[name](idx)  # (B, 1)

        # ===== 2) FM 部分 =====
        # 类别 embedding: list of (B, embed_dim)
        sparse_embeds = []
        for i, name in enumerate(self.sparse_feature_names):
            idx = sparse_input[:, i]
            sparse_embeds.append(self.fm_sparse_embeddings[name](idx))  # (B, E)

        # 连续特征投影
        dense_proj = self.fm_dense_proj(dense_input)  # (B, n_cat * E)
        dense_embeds = dense_proj.view(batch_size, len(self.sparse_feature_names), self.embedding_dim)
        # dense_embeds: (B, n_cat, E)

        all_embeds = torch.stack(sparse_embeds, dim=1) + dense_embeds  # (B, n_cat, E)

        # FM 公式: 0.5 * (sum^2 - sum_of_squares)
        sum_of_embeds = all_embeds.sum(dim=1)  # (B, E)
        sum_of_squares = (all_embeds ** 2).sum(dim=1)  # (B, E)
        fm_out = 0.5 * (sum_of_embeds ** 2 - sum_of_squares).sum(dim=1, keepdim=True)  # (B, 1)

        # ===== 3) Deep 部分 =====
        sparse_flat = torch.cat(sparse_embeds, dim=1)  # (B, n_cat * E)
        dense_flat = dense_proj  # (B, n_cat * E)
        dnn_input = torch.cat([dense_input, sparse_flat, dense_flat], dim=1)
        dnn_out = self.dnn_output(self.dnn(dnn_input))  # (B, 1)

        # ===== 融合 =====
        combined = torch.cat([linear_out, fm_out, dnn_out], dim=1)  # (B, 3)
        output = self.sigmoid(self.output_layer(combined))  # (B, 1)
        return output.squeeze(1)  # (B,)


# ============================================================
# 数据准备
# ============================================================

def build_vocab_encoders():
    """构建类别特征 -> 索引的映射"""
    encoders = {
        "cuisine_type": {v: i + 1 for i, v in enumerate(CUISINE_VOCAB + ["其他", "unknown"])},
        "meal_period": {v: i + 1 for i, v in enumerate(MEAL_PERIOD_VOCAB + ["unknown"])},
        "user_segment": {v: i + 1 for i, v in enumerate(USER_SEGMENT_VOCAB + ["unknown"])},
        "weather_condition": {v: i + 1 for i, v in enumerate(WEATHER_VOCAB + ["其他", "unknown"])},
    }
    # vocab_size = max_index + 1 (0 留给 padding)
    dims = {name: max(enc.values()) + 1 for name, enc in encoders.items()}
    return encoders, dims


def load_and_prepare(data_path: str):
    """加载数据并准备 DeepFM 的输入张量"""
    records = []
    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                feat = obj["features"]
                feat["label"] = obj["label"]
                records.append(feat)
            except Exception:
                continue

    df = pd.DataFrame(records)
    logger.info(f"✅ 加载 {len(df)} 条训练样本")

    # 数值特征
    for col in ALL_NUMERIC:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = df[col].fillna(0).astype(np.float32)

    # 类别特征编码
    encoders, dims = build_vocab_encoders()
    for cat_col in CATEGORICAL_FEATURES:
        if cat_col not in df.columns:
            df[cat_col] = "unknown"
        enc = encoders[cat_col]
        df[cat_col] = df[cat_col].fillna("unknown").astype(str).map(lambda x: enc.get(x, enc.get("unknown", 0)))

    dense_tensor = torch.tensor(df[ALL_NUMERIC].values, dtype=torch.float32)
    sparse_tensor = torch.tensor(df[CATEGORICAL_FEATURES].values, dtype=torch.long)
    label_tensor = torch.tensor(df["label"].values, dtype=torch.float32)

    return dense_tensor, sparse_tensor, label_tensor, encoders, dims


# ============================================================
# 训练
# ============================================================

def train_deepfm(
    data_path: str,
    save_path: Optional[str] = None,
    epochs: int = 20,
    batch_size: int = 256,
    lr: float = 0.001,
    embedding_dim: int = 8,
    device: str = "cpu",
):
    dense, sparse, labels, encoders, dims = load_and_prepare(data_path)

    # 划分训练/验证
    n = len(labels)
    perm = torch.randperm(n)
    split = int(n * 0.8)
    train_idx, val_idx = perm[:split], perm[split:]

    train_ds = TensorDataset(dense[train_idx], sparse[train_idx], labels[train_idx])
    val_ds = TensorDataset(dense[val_idx], sparse[val_idx], labels[val_idx])
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size)

    # 构建模型
    model = DeepFM(
        num_numeric=len(ALL_NUMERIC),
        sparse_feature_dims=dims,
        embedding_dim=embedding_dim,
        dnn_hidden_units=(128, 64, 32),
        dropout=0.2,
    ).to(device)

    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.5)

    best_val_loss = float("inf")
    best_state = None

    for epoch in range(1, epochs + 1):
        # --- 训练 ---
        model.train()
        train_loss = 0.0
        for d, s, y in train_loader:
            d, s, y = d.to(device), s.to(device), y.to(device)
            pred = model(d, s)
            # 将标签 clamp 到 (0,1) 范围用于 BCE
            y_clamped = y.clamp(0.001, 0.999)
            loss = criterion(pred, y_clamped)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(y)

        # --- 验证 ---
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for d, s, y in val_loader:
                d, s, y = d.to(device), s.to(device), y.to(device)
                pred = model(d, s)
                y_clamped = y.clamp(0.001, 0.999)
                loss = criterion(pred, y_clamped)
                val_loss += loss.item() * len(y)

        train_loss /= len(train_ds)
        val_loss /= len(val_ds)
        scheduler.step(val_loss)

        if epoch % 5 == 0 or epoch == 1:
            logger.info(f"Epoch {epoch:3d}: train_loss={train_loss:.4f}  val_loss={val_loss:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = model.state_dict().copy()

    # 保存最佳模型
    if save_path is None:
        save_path = os.path.join(MODEL_DIR, "deepfm_ranking.pth")
    Path(os.path.dirname(save_path)).mkdir(parents=True, exist_ok=True)

    # 保存模型权重 + 元数据
    checkpoint = {
        "state_dict": best_state or model.state_dict(),
        "encoders": encoders,
        "dims": dims,
        "num_numeric": len(ALL_NUMERIC),
        "embedding_dim": embedding_dim,
        "numeric_features": ALL_NUMERIC,
        "categorical_features": CATEGORICAL_FEATURES,
    }
    torch.save(checkpoint, save_path)
    logger.info(f"✅ DeepFM 模型已保存到 {save_path}  (best val_loss={best_val_loss:.4f})")

    return model, save_path, encoders, dims


def main():
    parser = argparse.ArgumentParser(description="DeepFM CTR 模型训练")
    parser.add_argument("--data", default=os.path.join(DATA_DIR, "training_samples.jsonl"),
                        help="训练数据路径")
    parser.add_argument("--epochs", type=int, default=20, help="训练轮数")
    parser.add_argument("--batch-size", type=int, default=256, help="批大小")
    parser.add_argument("--lr", type=float, default=0.001, help="学习率")
    parser.add_argument("--embedding-dim", type=int, default=8, help="Embedding 维度")
    parser.add_argument("--output", default=None, help="模型输出路径")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    if not os.path.exists(args.data):
        logger.error(f"❌ 训练数据不存在: {args.data}")
        logger.info("💡 请先运行推荐服务并积累用户反馈数据")
        return

    train_deepfm(
        data_path=args.data,
        save_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        embedding_dim=args.embedding_dim,
    )
    logger.info("🎉 训练完成！")


if __name__ == "__main__":
    main()
