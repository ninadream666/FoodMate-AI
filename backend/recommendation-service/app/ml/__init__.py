"""
ML 模型模块

提供 LightGBM + DeepFM 融合排序能力，替代/增强原有 MAB 规则策略。

模块结构:
- feature_engineering.py  : 统一特征提取 & 编码
- data_collector.py       : 推荐日志落盘（训练样本收集）
- train_lightgbm.py       : LightGBM 排序模型训练
- train_deepfm.py         : DeepFM CTR 模型训练
- inference_engine.py     : 双模型加载 & Ensemble 推理
- ensemble_strategy.py    : MABStrategy 子类，接入 DecisionAgent
"""
