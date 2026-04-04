"""
LightGBM排序模型训练脚本

功能:
- 从training_samples.jsonl加载数据
- LambdaRank/Regression训练
- 支持增量训练(init_model)
- 输出SHAP特征重要性
- 保存模型到models/lightgbm_ranking.txt

用法:
    python -m app.ml.train_lightgbm                       # 全量训练
    python -m app.ml.train_lightgbm --incremental          # 增量训练
    python -m app.ml.train_lightgbm --objective lambdarank # LTR 模式
"""

import os
import sys
import json
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
import pandas as pd

# 路径处理
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

from app.ml.feature_engineering import (
    ALL_NUMERIC, CATEGORICAL_FEATURES, extract_features,
    CUISINE_VOCAB, MEAL_PERIOD_VOCAB, USER_SEGMENT_VOCAB, WEATHER_VOCAB,
)

logger = logging.getLogger(__name__)

# 默认路径
DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(ROOT_DIR, "ml_data"))
MODEL_DIR = os.path.join(ROOT_DIR, "models")


def load_training_data(data_path: str) -> pd.DataFrame:
    """从 JSONL 文件加载训练数据"""
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
                feat["restaurant_id"] = obj.get("restaurant_id", "")
                feat["feedback_type"] = obj.get("feedback_type", "impression")
                records.append(feat)
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"跳过无效行: {e}")
    
    df = pd.DataFrame(records)
    logger.info(f"✅ 加载 {len(df)} 条训练样本")
    return df


def prepare_lgb_data(df: pd.DataFrame):
    """
    准备LightGBM数据集

    Returns: X, y, feature_names, categorical_feature_indices
    """
    import lightgbm as lgb

    feature_cols = ALL_NUMERIC + CATEGORICAL_FEATURES
    
    # 确保所有列存在
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0.0 if col in ALL_NUMERIC else "unknown"

    # 类别特征编码
    cat_vocabs = {
        "cuisine_type": CUISINE_VOCAB + ["其他", "unknown"],
        "meal_period": MEAL_PERIOD_VOCAB + ["unknown"],
        "user_segment": USER_SEGMENT_VOCAB + ["unknown"],
        "weather_condition": WEATHER_VOCAB + ["其他", "unknown"],
    }
    
    for cat_col in CATEGORICAL_FEATURES:
        vocab = cat_vocabs.get(cat_col, [])
        # 将未知值归入"unknown"
        df[cat_col] = df[cat_col].fillna("unknown").astype(str)
        if vocab:
            df[cat_col] = df[cat_col].apply(lambda x: x if x in vocab else "unknown")
        df[cat_col] = df[cat_col].astype("category")

    X = df[feature_cols]
    y = df["label"].astype(float)

    # 类别特征索引
    cat_indices = [feature_cols.index(c) for c in CATEGORICAL_FEATURES]

    return X, y, feature_cols, cat_indices


def train_regression(
    X, y, feature_names, cat_indices,
    init_model_path: Optional[str] = None,
    save_path: Optional[str] = None,
    n_rounds: int = 500,
    early_stopping: int = 50,
):
    """训练Regression模型（预测点击/下单概率）"""
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    train_data = lgb.Dataset(X_train, label=y_train, 
                              feature_name=feature_names,
                              categorical_feature=[feature_names[i] for i in cat_indices])
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

    params = {
        "objective": "regression",
        "metric": ["rmse", "mae"],
        "learning_rate": 0.05,
        "num_leaves": 31,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "min_child_samples": 10,
        "verbose": -1,
        "seed": 42,
    }

    init_model = init_model_path if init_model_path and os.path.exists(init_model_path) else None

    callbacks = [
        lgb.early_stopping(stopping_rounds=early_stopping),
        lgb.log_evaluation(period=50),
    ]

    model = lgb.train(
        params,
        train_data,
        num_boost_round=n_rounds,
        valid_sets=[val_data],
        valid_names=["val"],
        init_model=init_model,
        callbacks=callbacks,
    )

    # 保存
    if save_path is None:
        save_path = os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
    Path(os.path.dirname(save_path)).mkdir(parents=True, exist_ok=True)
    model.save_model(save_path)
    logger.info(f"✅ LightGBM 模型已保存到 {save_path}")

    # 特征重要性
    importance = model.feature_importance(importance_type="gain")
    feat_imp = sorted(zip(feature_names, importance), key=lambda x: x[1], reverse=True)
    logger.info("📊 特征重要性 (Gain):")
    for name, imp in feat_imp[:15]:
        logger.info(f"  {name:25s} : {imp:.1f}")

    return model, save_path


def train_lambdarank(
    X, y, feature_names, cat_indices,
    groups: Optional[List[int]] = None,
    save_path: Optional[str] = None,
    n_rounds: int = 500,
):
    """训练LambdaRank模型（Learning-to-Rank）"""
    import lightgbm as lgb
    from sklearn.model_selection import GroupShuffleSplit

    if groups is None:
        # 如果没有group信息，退化为regression
        logger.warning("⚠️ 无 group 信息，退化为 regression 训练")
        return train_regression(X, y, feature_names, cat_indices, save_path=save_path, n_rounds=n_rounds)

    train_data = lgb.Dataset(X, label=y, group=groups,
                              feature_name=feature_names,
                              categorical_feature=[feature_names[i] for i in cat_indices])

    params = {
        "objective": "lambdarank",
        "metric": "ndcg",
        "ndcg_eval_at": [3, 5, 10],
        "learning_rate": 0.05,
        "num_leaves": 31,
        "feature_fraction": 0.8,
        "verbose": -1,
        "seed": 42,
    }

    model = lgb.train(params, train_data, num_boost_round=n_rounds)

    if save_path is None:
        save_path = os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
    Path(os.path.dirname(save_path)).mkdir(parents=True, exist_ok=True)
    model.save_model(save_path)
    logger.info(f"✅ LightGBM LambdaRank 模型已保存到 {save_path}")

    return model, save_path


def main():
    parser = argparse.ArgumentParser(description="LightGBM 排序模型训练")
    parser.add_argument("--data", default=os.path.join(DATA_DIR, "training_samples.jsonl"),
                        help="训练数据路径")
    parser.add_argument("--objective", choices=["regression", "lambdarank"], default="regression",
                        help="训练目标")
    parser.add_argument("--incremental", action="store_true",
                        help="增量训练（在已有模型基础上继续训练）")
    parser.add_argument("--rounds", type=int, default=500, help="最大迭代轮数")
    parser.add_argument("--output", default=None, help="模型输出路径")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    if not os.path.exists(args.data):
        logger.error(f"❌ 训练数据不存在: {args.data}")
        logger.info("💡 请先运行推荐服务并积累用户反馈数据")
        return

    df = load_training_data(args.data)
    if len(df) < 50:
        logger.warning(f"⚠️ 样本数仅 {len(df)} 条，建议至少积累 500+ 条再训练")

    X, y, feature_names, cat_indices = prepare_lgb_data(df)

    save_path = args.output or os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
    init_model_path = save_path if args.incremental else None

    if args.objective == "regression":
        train_regression(X, y, feature_names, cat_indices,
                         init_model_path=init_model_path,
                         save_path=save_path,
                         n_rounds=args.rounds)
    else:
        train_lambdarank(X, y, feature_names, cat_indices,
                         save_path=save_path,
                         n_rounds=args.rounds)

    logger.info("🎉 训练完成！")


if __name__ == "__main__":
    main()
