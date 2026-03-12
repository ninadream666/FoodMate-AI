"""
NCF (Neural Collaborative Filtering) 训练脚本

训练 FoodCF-Encoder + NCF 双塔交互模型:
1. 从 training_samples.jsonl 提取 (user_profile, restaurant_desc, label) 三元组
2. 使用 FoodCF-Encoder 生成用户和餐厅语义嵌入
3. 训练 GMF + MLP 融合网络 (NCF)
4. 保存模型到 models/ncf_model.pth

用法:
    python -m app.ml.train_ncf
    python -m app.ml.train_ncf --epochs 30 --lr 0.0005
    python -m app.ml.train_ncf --generate-mock 2000
"""

import os
import sys
import json
import random
import logging
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

logger = logging.getLogger(__name__)

DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(ROOT_DIR, "ml_data"))
MODEL_DIR = os.path.join(ROOT_DIR, "models")

# 菜系/口味/价格词汇
CUISINE_VOCAB = [
    "川菜", "湘菜", "粤菜", "日料", "西餐", "火锅", "烧烤", "轻食",
    "沙拉", "面食", "粥", "快餐", "甜品", "奶茶", "炸鸡", "小龙虾",
    "韩餐", "泰餐", "披萨", "汉堡", "寿司", "拉面",
]

USER_SEGMENTS = ["student", "white_collar", "family", "health_conscious", "foodie"]
TASTE_PREFS = ["辣", "甜", "咸", "酸", "清淡", "麻辣", "鲜", "香"]


# ============================================================
# 模拟数据生成
# ============================================================

def generate_ncf_mock_data(n_users: int = 50, n_restaurants: int = 200,
                           interactions_per_user: int = 30,
                           output_path: Optional[str] = None) -> str:
    """
    生成 NCF 训练用的模拟三元组数据

    每条记录:
    {
        "user_profile_text": "偏好菜系: 川菜、火锅; 口味: 麻辣; 消费水平: 20-50元; 用户类型: student",
        "restaurant_text": "老四川火锅; 川菜·火锅; 招牌毛肚鸳鸯锅; 人均58元; 评分4.7",
        "label": 1.0  (0.0 | 0.3 | 0.5 | 1.0)
    }

    模拟逻辑:
    - 用户偏好菜系 ∩ 餐厅菜系 → 高 label
    - 价格区间匹配 → 高 label
    - 加入随机噪声模拟真实分布
    """
    if output_path is None:
        output_path = os.path.join(DATA_DIR, "ncf_training_data.jsonl")

    Path(os.path.dirname(output_path)).mkdir(parents=True, exist_ok=True)

    # 生成模拟用户
    users = []
    for uid in range(n_users):
        n_pref = random.randint(1, 4)
        cuisines = random.sample(CUISINE_VOCAB, n_pref)
        tastes = random.sample(TASTE_PREFS, random.randint(1, 3))
        min_price = random.choice([10, 15, 20, 30])
        max_price = min_price + random.choice([20, 30, 50, 80])
        segment = random.choice(USER_SEGMENTS)

        parts = []
        parts.append(f"偏好菜系: {'、'.join(cuisines)}")
        parts.append(f"口味: {'、'.join(tastes)}")
        parts.append(f"消费水平: {min_price}-{max_price}元")
        parts.append(f"用户类型: {segment}")

        users.append({
            "id": f"user_{uid:03d}",
            "text": "; ".join(parts),
            "cuisines": cuisines,
            "price_range": (min_price, max_price),
            "segment": segment,
        })

    # 生成模拟餐厅
    restaurants = []
    for rid in range(n_restaurants):
        cuisine = random.choice(CUISINE_VOCAB)
        rating = round(random.uniform(3.0, 5.0), 1)
        avg_price = random.randint(10, 120)
        distance = random.randint(200, 8000)

        name_prefixes = ["老", "新", "好味", "家常", "正宗", "地道", "鲜味"]
        name = random.choice(name_prefixes) + cuisine + random.choice(["馆", "店", "坊", "堂", "屋"])

        parts = [name, f"·{cuisine}"]
        parts.append(f"人均{avg_price}元")
        parts.append(f"评分{rating}")
        if distance >= 1000:
            parts.append(f"{distance / 1000:.1f}km")
        else:
            parts.append(f"{distance}m")

        restaurants.append({
            "id": f"rest_{rid:03d}",
            "text": "; ".join(parts),
            "cuisine": cuisine,
            "rating": rating,
            "avg_price": avg_price,
            "distance": distance,
        })

    # 生成交互三元组
    records = []
    for user in users:
        # 每个用户与若干餐厅交互
        sampled_rests = random.sample(restaurants, min(interactions_per_user, len(restaurants)))
        for rest in sampled_rests:
            # 计算匹配度 → label
            base_prob = 0.3

            # 菜系匹配
            if rest["cuisine"] in user["cuisines"]:
                base_prob += 0.30

            # 价格匹配
            min_p, max_p = user["price_range"]
            if min_p <= rest["avg_price"] <= max_p:
                base_prob += 0.15
            elif rest["avg_price"] > max_p * 1.5:
                base_prob -= 0.15

            # 评分加成
            if rest["rating"] >= 4.5:
                base_prob += 0.10
            elif rest["rating"] < 3.5:
                base_prob -= 0.10

            # 距离影响
            if rest["distance"] <= 1000:
                base_prob += 0.05
            elif rest["distance"] > 5000:
                base_prob -= 0.10

            # 噪声
            base_prob += random.gauss(0, 0.08)
            base_prob = max(0.0, min(1.0, base_prob))

            if base_prob < 0.25:
                label = 0.0
            elif base_prob < 0.50:
                label = 0.3
            elif base_prob < 0.70:
                label = 0.5
            else:
                label = 1.0

            records.append({
                "user_profile_text": user["text"],
                "restaurant_text": rest["text"],
                "label": label,
            })

    random.shuffle(records)

    with open(output_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    label_counts = {}
    for r in records:
        lb = r["label"]
        label_counts[lb] = label_counts.get(lb, 0) + 1

    logger.info(f"✅ 生成 {len(records)} 条 NCF 训练数据到 {output_path}")
    logger.info(f"📊 标签分布: {label_counts}")
    return output_path


# ============================================================
# 训练核心
# ============================================================

def load_ncf_data(data_path: str) -> Tuple[List[str], List[str], np.ndarray]:
    """
    加载 NCF 训练数据

    Returns:
        user_texts: 用户画像文本列表
        restaurant_texts: 餐厅描述文本列表
        labels: numpy 标签数组
    """
    user_texts = []
    rest_texts = []
    labels = []

    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                user_texts.append(obj["user_profile_text"])
                rest_texts.append(obj["restaurant_text"])
                labels.append(obj["label"])
            except Exception:
                continue

    logger.info(f"✅ 加载 {len(labels)} 条 NCF 训练样本")
    return user_texts, rest_texts, np.array(labels, dtype=np.float32)


def encode_texts_batch(encoder, texts: List[str], batch_size: int = 64,
                       desc: str = "Encoding") -> np.ndarray:
    """分批编码文本为嵌入向量"""
    all_embeds = []
    n = len(texts)
    for i in range(0, n, batch_size):
        batch = texts[i:i + batch_size]
        embeds = encoder.encode_restaurants_batch(batch)  # (batch, dim)
        all_embeds.append(embeds)
        if (i // batch_size) % 10 == 0:
            logger.info(f"  {desc}: {min(i + batch_size, n)}/{n}")
    return np.vstack(all_embeds)


def train_ncf(
    data_path: str,
    save_path: Optional[str] = None,
    epochs: int = 20,
    batch_size: int = 128,
    lr: float = 0.001,
    embed_dim: int = 128,
    device: str = "cpu",
):
    """
    训练 NCF 模型

    流程:
    1. 加载文本数据
    2. FoodCF-Encoder 编码用户/餐厅 → dense embeddings
    3. 训练 GMF+MLP 网络
    4. 保存模型
    """
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset

    # 1. 加载数据
    user_texts, rest_texts, labels = load_ncf_data(data_path)
    if len(labels) == 0:
        logger.error("❌ 无训练数据")
        return None, None

    # 2. 编码嵌入
    logger.info("🔄 使用 FoodCF-Encoder 编码嵌入...")
    from app.ml.foodcf_encoder import get_foodcf_encoder
    encoder = get_foodcf_encoder()
    logger.info(f"  Encoder 模式: {encoder.mode}")

    user_embeds = encode_texts_batch(encoder, user_texts, batch_size=64, desc="User")
    rest_embeds = encode_texts_batch(encoder, rest_texts, batch_size=64, desc="Restaurant")

    actual_dim = user_embeds.shape[1]
    logger.info(f"  嵌入维度: {actual_dim}")

    # 3. 准备 PyTorch 数据
    user_tensor = torch.from_numpy(user_embeds.astype(np.float32))
    rest_tensor = torch.from_numpy(rest_embeds.astype(np.float32))
    label_tensor = torch.from_numpy(labels)

    n = len(labels)
    perm = torch.randperm(n)
    split = int(n * 0.8)
    train_idx, val_idx = perm[:split], perm[split:]

    train_ds = TensorDataset(user_tensor[train_idx], rest_tensor[train_idx], label_tensor[train_idx])
    val_ds = TensorDataset(user_tensor[val_idx], rest_tensor[val_idx], label_tensor[val_idx])
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size)

    # 4. 构建 NCF 模型
    from app.ml.ncf_model import _build_ncf_model
    model = _build_ncf_model(embed_dim=actual_dim).to(device)

    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.5)

    best_val_loss = float("inf")
    best_state = None

    logger.info(f"🚀 开始训练 NCF (epochs={epochs}, batch_size={batch_size}, lr={lr})")

    for epoch in range(1, epochs + 1):
        # --- 训练 ---
        model.train()
        train_loss = 0.0
        for u, r, y in train_loader:
            u, r, y = u.to(device), r.to(device), y.to(device)
            y_clamped = y.clamp(0.001, 0.999)
            pred = model(u, r)
            loss = criterion(pred, y_clamped)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(y)

        # --- 验证 ---
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for u, r, y in val_loader:
                u, r, y = u.to(device), r.to(device), y.to(device)
                y_clamped = y.clamp(0.001, 0.999)
                pred = model(u, r)
                loss = criterion(pred, y_clamped)
                val_loss += loss.item() * len(y)

        train_loss /= len(train_ds)
        val_loss /= len(val_ds)
        scheduler.step(val_loss)

        if epoch % 5 == 0 or epoch == 1:
            logger.info(f"Epoch {epoch:3d}: train_loss={train_loss:.4f}  val_loss={val_loss:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    # 5. 保存模型
    if save_path is None:
        save_path = os.path.join(MODEL_DIR, "ncf_model.pth")
    Path(os.path.dirname(save_path)).mkdir(parents=True, exist_ok=True)

    checkpoint = {
        "state_dict": best_state or model.state_dict(),
        "embed_dim": actual_dim,
        "encoder_mode": encoder.mode,
    }
    torch.save(checkpoint, save_path)
    logger.info(f"✅ NCF 模型已保存到 {save_path}  (best val_loss={best_val_loss:.4f})")

    return model, save_path


# ============================================================
# 入口
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="NCF 协同过滤模型训练")
    parser.add_argument("--data", default=os.path.join(DATA_DIR, "ncf_training_data.jsonl"),
                        help="训练数据路径")
    parser.add_argument("--epochs", type=int, default=20, help="训练轮数")
    parser.add_argument("--batch-size", type=int, default=128, help="批大小")
    parser.add_argument("--lr", type=float, default=0.001, help="学习率")
    parser.add_argument("--output", default=None, help="模型输出路径")
    parser.add_argument("--generate-mock", type=int, default=0,
                        help="生成模拟数据条数 (0=不生成)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    # 可选: 生成模拟数据
    if args.generate_mock > 0:
        n_users = max(20, args.generate_mock // 30)
        n_restaurants = max(50, args.generate_mock // 5)
        generate_ncf_mock_data(
            n_users=n_users,
            n_restaurants=n_restaurants,
            interactions_per_user=30,
            output_path=args.data,
        )

    if not os.path.exists(args.data):
        logger.error(f"❌ 训练数据不存在: {args.data}")
        logger.info("💡 使用 --generate-mock 2000 可先生成模拟数据")
        return

    train_ncf(
        data_path=args.data,
        save_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
    )
    logger.info("🎉 NCF 训练完成！")


if __name__ == "__main__":
    main()
