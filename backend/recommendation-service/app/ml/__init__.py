"""
ML模型模块

提供LightGBM+DeepFM融合排序能力，替代/增强原有MAB规则策略。

模块结构:
- feature_engineering.py  : 统一特征提取&编码
- data_collector.py       : 推荐日志落盘（训练样本收集）
- train_lightgbm.py       : LightGBM排序模型训练
- train_deepfm.py         : DeepFM CTR模型训练
- inference_engine.py     : 双模型加载&Ensemble推理
- ensemble_strategy.py    : MABStrategy子类，接入DecisionAgent
"""
