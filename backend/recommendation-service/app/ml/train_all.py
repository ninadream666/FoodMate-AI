"""
一键训练脚本 — 同时训练 LightGBM + DeepFM

用法:
    cd backend/recommendation-service
    python -m app.ml.train_all                          # 全量训练
    python -m app.ml.train_all --incremental             # LightGBM 增量训练
    python -m app.ml.train_all --lgb-only                # 仅训练 LightGBM
    python -m app.ml.train_all --deepfm-only             # 仅训练 DeepFM
    python -m app.ml.train_all --generate-mock 2000      # 先生成模拟数据再训练
"""

import os
import sys
import json
import random
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

from app.ml.feature_engineering import (
    CUISINE_VOCAB, MEAL_PERIOD_VOCAB, USER_SEGMENT_VOCAB, WEATHER_VOCAB,
)

logger = logging.getLogger(__name__)

DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(ROOT_DIR, "ml_data"))
MODEL_DIR = os.path.join(ROOT_DIR, "models")


def generate_mock_data(n_samples: int = 2000, output_path: str = None):
    """
    生成模拟训练数据（冷启动阶段用，正式上线后替换为真实数据）

    模拟逻辑:
    - 距离近 + 评分高 + 价格匹配 → label 高
    - 恶劣天气 + 远距离 → label 低
    - 运动后 + 健康菜系 → label 高
    - 添加随机噪声模拟真实分布
    """
    if output_path is None:
        output_path = os.path.join(DATA_DIR, "training_samples.jsonl")
    
    Path(os.path.dirname(output_path)).mkdir(parents=True, exist_ok=True)
    
    records = []
    for i in range(n_samples):
        # 随机生成餐厅特征
        distance = random.randint(200, 8000)
        rating = round(random.uniform(2.5, 5.0), 1)
        price = random.randint(10, 120)
        delivery_time = random.randint(10, 60)
        order_count = random.randint(0, 5000)
        cuisine = random.choice(CUISINE_VOCAB)
        is_hot_food = 1 if cuisine in ["火锅", "烧烤", "川菜", "湘菜", "面食", "粥"] else random.choice([0, 1])
        
        # 随机生成上下文特征
        temperature = random.randint(-5, 42)
        congestion_index = round(random.uniform(0.8, 2.5), 2)
        is_bad_weather = random.choice([0, 0, 0, 1])  # 25% 概率恶劣天气
        is_peak_hour = random.choice([0, 0, 1])
        is_post_workout = random.choice([0, 0, 0, 0, 1])  # 20% 概率
        is_weekend = random.choice([0, 0, 0, 0, 0, 1, 1])  # ~28%
        is_holiday = random.choice([0] * 9 + [1])
        cuisine_match = random.choice([0, 0, 1, 1, 1])  # 60%
        intent_match = random.choice([0, 0, 0, 1])
        weather_condition = random.choice(WEATHER_VOCAB)
        meal_period = random.choice(MEAL_PERIOD_VOCAB[:-1])  # 排除 unknown
        user_segment = random.choice(USER_SEGMENT_VOCAB[:-1])
        
        # 归一化分
        max_distance = 5000
        distance_score = max(0.0, min(1.0, 1 - distance / max_distance))
        rating_score = max(0.0, min(1.0, (rating - 2.5) / 2.5))
        price_score = 1.0 if 15 <= price <= 80 else max(0.0, 1 - abs(price - 50) / 80)
        time_score = max(0.0, min(1.0, 1 - (delivery_time - 15) / 45))
        
        # === 生成 label（模拟真实用户行为）===
        # 基础分：距离、评分、配送时间的综合
        base_prob = 0.25 * distance_score + 0.30 * rating_score + 0.15 * price_score + 0.15 * time_score + 0.15 * (order_count / 5000)
        
        # 上下文调整
        if is_bad_weather and distance > 3000:
            base_prob -= 0.15
        if is_bad_weather and distance < 1000:
            base_prob += 0.10
        if is_post_workout and cuisine in ["轻食", "沙拉", "粥", "日料"]:
            base_prob += 0.20
        if is_post_workout and cuisine in ["火锅", "烧烤", "炸鸡"]:
            base_prob -= 0.10
        if temperature >= 30 and cuisine in ["沙拉", "甜品", "日料"]:
            base_prob += 0.12
        if temperature <= 10 and cuisine in ["火锅", "粥", "面食"]:
            base_prob += 0.12
        if intent_match:
            base_prob += 0.25
        if cuisine_match:
            base_prob += 0.10
        if congestion_index > 1.5 and distance > 3000:
            base_prob -= 0.10
        
        # 加噪声
        base_prob += random.gauss(0, 0.08)
        base_prob = max(0.0, min(1.0, base_prob))
        
        # 转换为离散 label: 0(忽略), 0.3(点击), 0.5(评价), 1.0(下单)
        if base_prob < 0.25:
            label = 0.0
        elif base_prob < 0.50:
            label = 0.3
        elif base_prob < 0.70:
            label = 0.5
        else:
            label = 1.0
        
        feedback_map = {0.0: "impression", 0.3: "click", 0.5: "rating", 1.0: "order"}
        
        record = {
            "timestamp": (datetime.now() - timedelta(hours=random.randint(0, 720))).isoformat(),
            "restaurant_id": f"mock_r_{i:04d}",
            "rank": random.randint(1, 10),
            "features": {
                "distance": distance,
                "rating": rating,
                "price": price,
                "delivery_time": delivery_time,
                "order_count": order_count,
                "temperature": temperature,
                "congestion_index": congestion_index,
                "distance_score": round(distance_score, 4),
                "rating_score": round(rating_score, 4),
                "price_score": round(price_score, 4),
                "time_score": round(time_score, 4),
                "mab_avg_reward": round(random.uniform(0, 0.8), 3),
                "mab_pulls": random.randint(0, 50),
                "is_bad_weather": is_bad_weather,
                "is_peak_hour": is_peak_hour,
                "is_post_workout": is_post_workout,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "cuisine_match": cuisine_match,
                "intent_match": intent_match,
                "is_hot_food": is_hot_food,
                "cuisine_type": cuisine,
                "meal_period": meal_period,
                "user_segment": user_segment,
                "weather_condition": weather_condition,
            },
            "label": label,
            "feedback_type": feedback_map[label],
        }
        records.append(record)

    with open(output_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    logger.info(f"✅ 生成 {n_samples} 条模拟训练数据到 {output_path}")
    
    # 统计
    label_counts = {}
    for r in records:
        lb = r["label"]
        label_counts[lb] = label_counts.get(lb, 0) + 1
    logger.info(f"📊 标签分布: {label_counts}")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="一键训练 LightGBM + DeepFM")
    parser.add_argument("--data", default=os.path.join(DATA_DIR, "training_samples.jsonl"))
    parser.add_argument("--generate-mock", type=int, default=0,
                        help="生成模拟训练数据的样本数（0=不生成）")
    parser.add_argument("--lgb-only", action="store_true", help="仅训练 LightGBM")
    parser.add_argument("--deepfm-only", action="store_true", help="仅训练 DeepFM")
    parser.add_argument("--incremental", action="store_true", help="LightGBM 增量训练")
    parser.add_argument("--lgb-rounds", type=int, default=500)
    parser.add_argument("--deepfm-epochs", type=int, default=20)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    # Step 0: 生成模拟数据（可选）
    if args.generate_mock > 0:
        generate_mock_data(args.generate_mock, args.data)

    if not os.path.exists(args.data):
        logger.error(f"❌ 训练数据不存在: {args.data}")
        logger.info("💡 使用 --generate-mock 2000 可先生成模拟数据")
        return

    # Step 1: 训练 LightGBM
    if not args.deepfm_only:
        logger.info("=" * 60)
        logger.info("🌲 开始训练 LightGBM ...")
        logger.info("=" * 60)
        try:
            from app.ml.train_lightgbm import load_training_data, prepare_lgb_data, train_regression
            df = load_training_data(args.data)
            X, y, feature_names, cat_indices = prepare_lgb_data(df)
            lgb_path = os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
            init_model = lgb_path if args.incremental else None
            train_regression(X, y, feature_names, cat_indices,
                             init_model_path=init_model,
                             save_path=lgb_path,
                             n_rounds=args.lgb_rounds)
        except Exception as e:
            logger.error(f"❌ LightGBM 训练失败: {e}")
            import traceback
            traceback.print_exc()

    # Step 2: 训练 DeepFM
    if not args.lgb_only:
        logger.info("=" * 60)
        logger.info("🧠 开始训练 DeepFM ...")
        logger.info("=" * 60)
        try:
            from app.ml.train_deepfm import train_deepfm
            deepfm_path = os.path.join(MODEL_DIR, "deepfm_ranking.pth")
            train_deepfm(
                data_path=args.data,
                save_path=deepfm_path,
                epochs=args.deepfm_epochs,
            )
        except Exception as e:
            logger.error(f"❌ DeepFM 训练失败: {e}")
            import traceback
            traceback.print_exc()

    logger.info("=" * 60)
    logger.info("🎉 训练全部完成！")
    logger.info(f"📁 模型目录: {MODEL_DIR}")
    
    # 列出模型文件
    if os.path.exists(MODEL_DIR):
        for f in os.listdir(MODEL_DIR):
            fpath = os.path.join(MODEL_DIR, f)
            size_mb = os.path.getsize(fpath) / 1024 / 1024
            logger.info(f"  📄 {f} ({size_mb:.2f} MB)")
    
    logger.info("")
    logger.info("📋 下一步: 在推荐服务中切换到 ML 策略:")
    logger.info('   mab_strategy="ml_ensemble"')
    logger.info("   或设置环境变量: MAB_STRATEGY=ml_ensemble")


if __name__ == "__main__":
    main()
