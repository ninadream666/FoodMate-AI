"""
训练数据收集器

在每次推荐+用户反馈时，将<特征, 标签>异步落盘为CSV / JSON Lines，
供后续LightGBM/DeepFM离线训练使用。

写入路径：  {DATA_DIR}/training_samples.jsonl
每行一条 JSON，格式:
{
  "timestamp": "...",
  "restaurant_id": "...",
  "features": { ... },        # extract_features() 的输出
  "label": 0.0 | 0.3 | 0.5 | 1.0,
  "feedback_type": "impression" | "click" | "order" | "rating"
}
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

from .feature_engineering import extract_features

logger = logging.getLogger(__name__)

# 数据目录：容器内持久卷/本地开发目录
DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "ml_data"
))

# 反馈 → 标签映射
FEEDBACK_LABEL_MAP = {
    "impression": 0.0,    # 曝光但未点击
    "click": 0.3,         # 点击浏览
    "rating": 0.5,        # 给予评分
    "order": 1.0,         # 下单转化
}


class TrainingDataCollector:
    """
    异步训练数据收集器

    - log_impression(): 推荐曝光时调用（label=0，后续若有反馈会更新）
    - log_feedback():   用户反馈时调用（click/order/rating）
    """

    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self._ensure_dir()
        self._file_path = os.path.join(self.data_dir, "training_samples.jsonl")
        self._lock = asyncio.Lock()
        # 内存缓存：记录最近的impression，便于后续用反馈覆盖
        self._recent_impressions: Dict[str, Dict[str, Any]] = {}
        logger.info(f"📦 TrainingDataCollector 初始化，数据目录: {self.data_dir}")

    def _ensure_dir(self):
        Path(self.data_dir).mkdir(parents=True, exist_ok=True)

    async def log_impression(
        self,
        restaurant_id: str,
        arm_features: Dict[str, Any],
        context: Dict[str, Any],
        mab_pulls: int = 0,
        mab_avg_reward: float = 0.0,
        rank: int = 0,
    ):
        """记录一次推荐曝光，默认label=0.0，后续反馈会追加新行"""
        features = extract_features(arm_features, context, mab_pulls, mab_avg_reward)
        record = {
            "timestamp": datetime.now().isoformat(),
            "restaurant_id": restaurant_id,
            "rank": rank,
            "features": features,
            "label": 0.0,
            "feedback_type": "impression",
        }
        # 缓存以便后续反馈时可快速获取特征
        self._recent_impressions[restaurant_id] = record
        await self._append(record)

    async def log_feedback(
        self,
        restaurant_id: str,
        feedback_type: str,
        arm_features: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        mab_pulls: int = 0,
        mab_avg_reward: float = 0.0,
        reward_value: Optional[float] = None,
    ):
        """
        记录用户反馈（click/order/rating）

        如果arm_features/context未传，会尝试从最近的impression缓存中复用。
        """
        label = reward_value if reward_value is not None else FEEDBACK_LABEL_MAP.get(feedback_type, 0.0)

        # 尝试复用缓存的特征
        cached = self._recent_impressions.get(restaurant_id)
        if arm_features and context:
            features = extract_features(arm_features, context, mab_pulls, mab_avg_reward)
        elif cached:
            features = cached["features"]
        else:
            logger.warning(f"⚠️ 无法找到 restaurant_id={restaurant_id} 的特征缓存，跳过记录")
            return

        record = {
            "timestamp": datetime.now().isoformat(),
            "restaurant_id": restaurant_id,
            "features": features,
            "label": label,
            "feedback_type": feedback_type,
        }
        await self._append(record)

    async def log_batch_impressions(
        self,
        arms_with_context: List[Dict[str, Any]],
        context: Dict[str, Any],
    ):
        """
        批量记录推荐结果：一次推荐请求的所有候选

        arms_with_context: [{"restaurant_id": ..., "features": ..., "pulls": ..., "avg_reward": ..., "rank": ...}]
        """
        for item in arms_with_context:
            await self.log_impression(
                restaurant_id=item["restaurant_id"],
                arm_features=item["features"],
                context=context,
                mab_pulls=item.get("pulls", 0),
                mab_avg_reward=item.get("avg_reward", 0.0),
                rank=item.get("rank", 0),
            )

    async def _append(self, record: Dict[str, Any]):
        """异步追加写入JSONL文件"""
        async with self._lock:
            try:
                with open(self._file_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(record, ensure_ascii=False) + "\n")
            except Exception as e:
                logger.error(f"❌ 写入训练数据失败: {e}")

    def get_sample_count(self) -> int:
        """返回当前采集的样本总数"""
        if not os.path.exists(self._file_path):
            return 0
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                return sum(1 for _ in f)
        except Exception:
            return 0

    def get_data_path(self) -> str:
        return self._file_path


# 全局单例
_collector: Optional[TrainingDataCollector] = None


def get_collector() -> TrainingDataCollector:
    global _collector
    if _collector is None:
        _collector = TrainingDataCollector()
    return _collector
