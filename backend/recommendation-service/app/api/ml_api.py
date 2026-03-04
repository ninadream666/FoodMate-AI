"""
ML 模型训练管理 API

提供 HTTP 接口管理 ML 模型的训练、状态查看和策略切换，
在 Docker 容器内直接调用，无需单独启动训练进程。

端点:
  POST /api/v2/ml/train           — 触发模型训练（后台异步执行）
  POST /api/v2/ml/generate-mock   — 生成模拟训练数据
  GET  /api/v2/ml/status          — 查看训练数据量 & 模型状态
  POST /api/v2/ml/switch-strategy — 运行时切换 MAB/ML 策略
  GET  /api/v2/ml/feature-importance — LightGBM 特征重要性
"""

import os
import asyncio
import logging
from typing import Optional
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ML模型管理"])

# 全局训练状态
_training_status = {
    "is_training": False,
    "last_train_time": None,
    "last_train_result": None,
    "last_train_error": None,
}

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.getenv("ML_DATA_DIR", os.path.join(ROOT_DIR, "ml_data"))
MODEL_DIR = os.getenv("ML_MODEL_DIR", os.path.join(ROOT_DIR, "models"))


# ============================================================
# Request / Response 模型
# ============================================================

class TrainRequest(BaseModel):
    lgb_only: bool = Field(False, description="仅训练 LightGBM")
    deepfm_only: bool = Field(False, description="仅训练 DeepFM")
    incremental: bool = Field(False, description="LightGBM 增量训练")
    lgb_rounds: int = Field(500, description="LightGBM 最大迭代轮数")
    deepfm_epochs: int = Field(20, description="DeepFM 训练轮数")


class MockDataRequest(BaseModel):
    n_samples: int = Field(2000, description="生成模拟样本数", ge=100, le=50000)


class SwitchStrategyRequest(BaseModel):
    strategy: str = Field(..., description="策略名: ucb1 / thompson / epsilon / contextual / ml_ensemble")


# ============================================================
# 后台训练函数
# ============================================================

def _run_training(
    data_path: str,
    lgb_only: bool = False,
    deepfm_only: bool = False,
    incremental: bool = False,
    lgb_rounds: int = 500,
    deepfm_epochs: int = 20,
):
    """在后台线程中执行训练"""
    global _training_status
    _training_status["is_training"] = True
    _training_status["last_train_error"] = None
    results = {}

    try:
        # 训练 LightGBM
        if not deepfm_only:
            try:
                from app.ml.train_lightgbm import (
                    load_training_data, prepare_lgb_data, train_regression
                )
                logger.info("🌲 开始训练 LightGBM ...")
                df = load_training_data(data_path)
                X, y, feature_names, cat_indices = prepare_lgb_data(df)
                lgb_path = os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
                init_model = lgb_path if incremental else None
                train_regression(
                    X, y, feature_names, cat_indices,
                    init_model_path=init_model,
                    save_path=lgb_path,
                    n_rounds=lgb_rounds,
                )
                results["lightgbm"] = {"status": "success", "model_path": lgb_path}
                logger.info("✅ LightGBM 训练完成")
            except Exception as e:
                results["lightgbm"] = {"status": "error", "error": str(e)}
                logger.error(f"❌ LightGBM 训练失败: {e}")

        # 训练 DeepFM
        if not lgb_only:
            try:
                from app.ml.train_deepfm import train_deepfm
                logger.info("🧠 开始训练 DeepFM ...")
                deepfm_path = os.path.join(MODEL_DIR, "deepfm_ranking.pth")
                train_deepfm(
                    data_path=data_path,
                    save_path=deepfm_path,
                    epochs=deepfm_epochs,
                )
                results["deepfm"] = {"status": "success", "model_path": deepfm_path}
                logger.info("✅ DeepFM 训练完成")
            except Exception as e:
                results["deepfm"] = {"status": "error", "error": str(e)}
                logger.error(f"❌ DeepFM 训练失败: {e}")

        _training_status["last_train_result"] = results
        _training_status["last_train_time"] = datetime.now().isoformat()
        logger.info(f"🎉 训练流程结束: {results}")

    except Exception as e:
        _training_status["last_train_error"] = str(e)
        logger.error(f"训练流程异常: {e}")
    finally:
        _training_status["is_training"] = False


# ============================================================
# 路由端点
# ============================================================

@router.post("/train", summary="触发模型训练", description="后台异步训练 LightGBM + DeepFM")
async def trigger_training(req: TrainRequest, background_tasks: BackgroundTasks):
    if _training_status["is_training"]:
        raise HTTPException(status_code=409, detail="训练正在进行中，请稍后再试")

    data_path = os.path.join(DATA_DIR, "training_samples.jsonl")
    if not os.path.exists(data_path):
        raise HTTPException(
            status_code=404,
            detail=f"训练数据不存在: {data_path}。请先调用 /ml/generate-mock 生成模拟数据，或等待推荐服务积累真实数据。"
        )

    # 用线程池跑训练（避免阻塞 asyncio event loop）
    import concurrent.futures
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    loop = asyncio.get_running_loop()
    loop.run_in_executor(
        executor,
        _run_training,
        data_path,
        req.lgb_only,
        req.deepfm_only,
        req.incremental,
        req.lgb_rounds,
        req.deepfm_epochs,
    )

    return {
        "message": "训练任务已提交（后台异步执行）",
        "config": req.dict(),
        "data_path": data_path,
        "monitor": "GET /api/v2/ml/status 查看进度",
    }


@router.post("/generate-mock", summary="生成模拟训练数据", description="冷启动阶段使用，生成模拟的推荐曝光+反馈数据")
async def generate_mock_data(req: MockDataRequest):
    try:
        from app.ml.train_all import generate_mock_data as _generate
        output_path = os.path.join(DATA_DIR, "training_samples.jsonl")
        _generate(n_samples=req.n_samples, output_path=output_path)
        
        # 统计行数
        line_count = 0
        with open(output_path, "r", encoding="utf-8") as f:
            line_count = sum(1 for _ in f)

        return {
            "message": f"成功生成 {req.n_samples} 条模拟训练数据",
            "output_path": output_path,
            "total_samples": line_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


@router.get("/status", summary="查看 ML 状态", description="训练数据量、模型文件、当前训练状态")
async def get_ml_status():
    # 训练数据统计
    data_path = os.path.join(DATA_DIR, "training_samples.jsonl")
    sample_count = 0
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            sample_count = sum(1 for _ in f)

    # 模型文件信息
    models = {}
    for fname in ["lightgbm_ranking.txt", "deepfm_ranking.pth"]:
        fpath = os.path.join(MODEL_DIR, fname)
        if os.path.exists(fpath):
            size_mb = os.path.getsize(fpath) / 1024 / 1024
            mtime = datetime.fromtimestamp(os.path.getmtime(fpath)).isoformat()
            models[fname] = {"exists": True, "size_mb": round(size_mb, 2), "modified": mtime}
        else:
            models[fname] = {"exists": False}

    # 推理引擎状态
    engine_status = None
    try:
        from app.ml.inference_engine import get_inference_engine
        engine = get_inference_engine()
        engine_status = engine.get_status()
    except Exception:
        pass

    return {
        "training_data": {
            "path": data_path,
            "sample_count": sample_count,
            "min_recommended": 500,
            "ready_for_training": sample_count >= 50,
        },
        "models": models,
        "inference_engine": engine_status,
        "training_status": _training_status,
        "data_dir": DATA_DIR,
        "model_dir": MODEL_DIR,
    }


@router.post("/switch-strategy", summary="切换推荐策略", description="运行时切换 MAB 规则策略或 ML 模型策略")
async def switch_strategy(req: SwitchStrategyRequest):
    valid_strategies = ["ucb1", "thompson", "epsilon", "contextual", "ml_ensemble"]
    if req.strategy not in valid_strategies:
        raise HTTPException(
            status_code=400,
            detail=f"无效策略: {req.strategy}。可选: {valid_strategies}"
        )

    try:
        from app.services.multi_agent_recommendation_service import multi_agent_recommendation_service
        if multi_agent_recommendation_service:
            multi_agent_recommendation_service.set_mab_strategy(req.strategy)
            return {
                "message": f"策略已切换为: {req.strategy}",
                "strategy": req.strategy,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            raise HTTPException(status_code=503, detail="推荐服务未初始化")
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"无法导入服务模块: {str(e)}")


@router.get("/feature-importance", summary="特征重要性", description="返回 LightGBM 模型的特征重要性排名")
async def get_feature_importance():
    lgb_path = os.path.join(MODEL_DIR, "lightgbm_ranking.txt")
    if not os.path.exists(lgb_path):
        raise HTTPException(status_code=404, detail="LightGBM 模型不存在，请先训练")

    try:
        import lightgbm as lgb
        model = lgb.Booster(model_file=lgb_path)
        importance = model.feature_importance(importance_type="gain")
        names = model.feature_name()
        
        feat_imp = sorted(zip(names, importance.tolist()), key=lambda x: x[1], reverse=True)
        
        return {
            "model_path": lgb_path,
            "importance_type": "gain",
            "features": [{"name": n, "importance": round(v, 2)} for n, v in feat_imp],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取特征重要性失败: {str(e)}")
