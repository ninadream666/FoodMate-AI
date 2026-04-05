"""
统一特征工程模块

将RestaurantArm+DecisionContext转换为模型可用的特征向量。
LightGBM和DeepFM共用同一套特征定义，保证训练/推理一致性。
"""

from typing import Dict, Any, List, Tuple
import numpy as np
import logging

logger = logging.getLogger(__name__)

# ============================================================
# 特征Schema定义
# ============================================================

# 连续特征（LightGBM直接使用，DeepFM走DenseFeature）
NUMERIC_FEATURES = [
    "distance",              # 餐厅到用户的距离（米）
    "rating",                # 餐厅评分 (1-5)
    "price",                 # 人均价格（元）
    "delivery_time",         # 预计配送时间（分钟）
    "order_count",           # 历史订单量
    "temperature",           # 当前温度（°C）
    "congestion_index",      # 交通拥堵指数
    "distance_score",        # 归一化距离分 (0-1)
    "rating_score",          # 归一化评分 (0-1)
    "price_score",           # 价格匹配度 (0-1)
    "time_score",            # 配送时间分 (0-1)
    "mab_avg_reward",        # MAB 历史平均奖励
    "mab_pulls",             # MAB 历史拉取次数
]

# 类别特征（LightGBM用category dtype，DeepFM走SparseFeat embedding）
CATEGORICAL_FEATURES = [
    "cuisine_type",          # 菜系类型
    "meal_period",           # 用餐时段: breakfast/lunch/dinner/afternoon_tea/night_snack
    "user_segment",          # 用户分群: premium/standard/budget
    "weather_condition",     # 天气状况: 晴/阴/小雨/大雨...
]

# 布尔特征（0/1 编码，归入连续特征）
BINARY_FEATURES = [
    "is_bad_weather",        # 恶劣天气
    "is_peak_hour",          # 高峰时段
    "is_post_workout",       # 运动后状态
    "is_weekend",            # 周末
    "is_holiday",            # 节假日
    "cuisine_match",         # 菜系是否匹配用户偏好
    "intent_match",          # 用户意图是否匹配
    "is_hot_food",           # 是否热食
]

ALL_NUMERIC = NUMERIC_FEATURES + BINARY_FEATURES   # LightGBM 全部当数值
ALL_FEATURES = ALL_NUMERIC + CATEGORICAL_FEATURES

# 菜系词表（用于DeepFM embedding，可按需扩展）
CUISINE_VOCAB = [
    "川菜", "湘菜", "粤菜", "东北菜", "西北菜", "鲁菜", "浙菜", "苏菜",
    "火锅", "烧烤", "日料", "韩餐", "西餐", "快餐", "小吃", "面食",
    "粥", "轻食", "沙拉", "甜品", "奶茶", "咖啡", "海鲜", "素食",
    "东南亚菜", "泰餐", "意面", "披萨", "汉堡", "炸鸡", "其他",
]

MEAL_PERIOD_VOCAB = ["breakfast", "lunch", "dinner", "afternoon_tea", "night_snack", "unknown"]
USER_SEGMENT_VOCAB = ["premium", "standard", "budget", "unknown"]
WEATHER_VOCAB = ["晴", "多云", "阴", "小雨", "中雨", "大雨", "暴雨", "雪", "雾", "其他"]


def _safe_float(val, default: float = 0.0) -> float:
    """安全转换为 float"""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val, default: int = 0) -> int:
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _match_cuisine(cuisine: str, vocab: List[str] = CUISINE_VOCAB) -> str:
    """将原始菜系字符串匹配到词表中最近的项"""
    if not cuisine:
        return "其他"
    cuisine_lower = cuisine.lower()
    for v in vocab:
        if v in cuisine_lower or cuisine_lower in v:
            return v
    return "其他"


def _match_weather(condition: str) -> str:
    if not condition:
        return "其他"
    for w in WEATHER_VOCAB:
        if w in condition:
            return w
    return "其他"


# ============================================================
# 核心提取函数
# ============================================================

def extract_features(
    arm_features: Dict[str, Any],
    context: Dict[str, Any],
    mab_pulls: int = 0,
    mab_avg_reward: float = 0.0,
) -> Dict[str, Any]:
    """
    从餐厅 arm 特征 + 决策上下文中提取统一特征向量。

    Parameters
    ----------
    arm_features : dict
        RestaurantArm.features （distance, rating, price, cuisine, delivery_time, ...）
    context : dict
        _build_decision_context() 返回的决策上下文
    mab_pulls : int
        该 arm 的历史 pulls 次数
    mab_avg_reward : float
        该 arm 的历史 average_reward

    Returns
    -------
    dict  键为 ALL_FEATURES 中的名字，值为数值或字符串
    """
    # ---------- 基础餐厅特征 ----------
    distance = _safe_float(arm_features.get("distance"), 2000)
    if distance <= 0:
        distance = 1000.0
    rating = _safe_float(arm_features.get("rating"), 4.0)
    if rating <= 0:
        rating = 4.0
    price = _safe_float(arm_features.get("price"), 35)
    if price <= 0:
        price = 35.0
    delivery_time = _safe_float(arm_features.get("delivery_time"), 25)
    if delivery_time <= 0:
        delivery_time = 25.0
    order_count = _safe_int(arm_features.get("order_count"), 0)
    is_hot_food = 1 if arm_features.get("is_hot_food", True) else 0
    cuisine_raw = str(arm_features.get("cuisine", ""))

    # ---------- 上下文特征 ----------
    env = context.get("environment", {})
    weather = env.get("weather", {})
    temporal = env.get("temporal", {})
    traffic = env.get("traffic", {})
    health_ctx = context.get("health_context", {})
    frontend_weather = context.get("frontend_weather", {})

    # 温度：优先前端
    temperature = _safe_float(
        frontend_weather.get("temperature") or weather.get("temperature"), 20
    )

    congestion_index = _safe_float(context.get("congestion_index", traffic.get("congestion_index", 1.0)), 1.0)
    is_bad_weather = 1 if (context.get("is_bad_weather") or frontend_weather.get("is_bad_weather") or weather.get("is_bad_weather")) else 0
    is_peak_hour = 1 if context.get("is_peak_hour", temporal.get("is_peak_hour", False)) else 0
    is_post_workout = 1 if health_ctx.get("is_post_workout", False) else 0
    is_weekend = 1 if temporal.get("is_weekend", False) else 0
    is_holiday = 1 if temporal.get("is_holiday", False) else 0

    # 菜系匹配
    preferred_cuisines = context.get("preferred_cuisines", [])
    cuisine_match = 1 if (preferred_cuisines and any(c in cuisine_raw for c in preferred_cuisines)) else 0

    # 意图匹配
    pure_query = str(context.get("pure_query", "")).strip().lower()
    name_str = str(arm_features.get("name", "")).lower() if "name" in arm_features else ""
    intent_match = 1 if (pure_query and pure_query not in ["餐厅", "美食", "饭店"] and
                         (pure_query in cuisine_raw.lower() or pure_query in name_str)) else 0

    # ---------- 归一化分 ----------
    max_distance = _safe_float(context.get("max_distance"), 20000)
    distance_score = max(0.0, min(1.0, 1 - distance / max_distance)) if max_distance > 0 else 0.5
    rating_score = max(0.0, min(1.0, (rating - 2.5) / 2.5))
    
    max_price = _safe_float(context.get("max_price"), 100)
    min_price = _safe_float(context.get("min_price"), 0)
    if min_price <= price <= max_price:
        price_score = 1.0
    elif price < min_price:
        price_score = 0.7
    else:
        price_score = max(0.0, 1 - (price - max_price) / 50)
    
    time_score = max(0.0, min(1.0, 1 - (delivery_time - 15) / 45))

    # ---------- 类别特征 ----------
    cuisine_type = _match_cuisine(cuisine_raw)
    meal_period = temporal.get("meal_period", "unknown")
    if meal_period not in MEAL_PERIOD_VOCAB:
        meal_period = "unknown"
    user_segment = context.get("user_segment", "standard")
    if user_segment not in USER_SEGMENT_VOCAB:
        user_segment = "unknown"
    weather_condition = _match_weather(
        str(frontend_weather.get("condition") or weather.get("condition", ""))
    )

    return {
        # 数值
        "distance": distance,
        "rating": rating,
        "price": price,
        "delivery_time": delivery_time,
        "order_count": order_count,
        "temperature": temperature,
        "congestion_index": congestion_index,
        "distance_score": distance_score,
        "rating_score": rating_score,
        "price_score": price_score,
        "time_score": time_score,
        "mab_avg_reward": mab_avg_reward,
        "mab_pulls": mab_pulls,
        # 布尔
        "is_bad_weather": is_bad_weather,
        "is_peak_hour": is_peak_hour,
        "is_post_workout": is_post_workout,
        "is_weekend": is_weekend,
        "is_holiday": is_holiday,
        "cuisine_match": cuisine_match,
        "intent_match": intent_match,
        "is_hot_food": is_hot_food,
        # 类别
        "cuisine_type": cuisine_type,
        "meal_period": meal_period,
        "user_segment": user_segment,
        "weather_condition": weather_condition,
    }


def features_to_numpy(
    feature_dicts: List[Dict[str, Any]],
) -> Tuple[np.ndarray, List[str], Dict[str, List[str]]]:
    """
    将多条特征字典转换为numpy数组（用于LightGBM）。

    Returns
    -------
    X : np.ndarray  shape (n, len(ALL_NUMERIC))
    numeric_cols : list[str]
    cat_values : dict  {cat_feature_name: [val_per_sample]}
    """
    numeric_cols = ALL_NUMERIC
    X = np.zeros((len(feature_dicts), len(numeric_cols)), dtype=np.float32)
    cat_values = {c: [] for c in CATEGORICAL_FEATURES}

    for i, fd in enumerate(feature_dicts):
        for j, col in enumerate(numeric_cols):
            X[i, j] = _safe_float(fd.get(col), 0.0)
        for c in CATEGORICAL_FEATURES:
            cat_values[c].append(str(fd.get(c, "unknown")))

    return X, numeric_cols, cat_values


def get_feature_names() -> List[str]:
    """返回全部特征名（数值+类别），顺序固定。"""
    return list(ALL_FEATURES)


def get_numeric_feature_names() -> List[str]:
    return list(ALL_NUMERIC)


def get_categorical_feature_names() -> List[str]:
    return list(CATEGORICAL_FEATURES)
