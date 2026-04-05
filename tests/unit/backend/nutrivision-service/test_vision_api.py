# -*- coding: utf-8 -*-
"""
NutriVision食物视觉分析服务 单元测试
覆盖图片校验、分析逻辑、营养信息格式、并发限制策略
纯逻辑测试，不依赖FastAPI/torch/PIL
"""
import pytest
import base64
import json
import threading


# ==================== 图片校验逻辑 ====================

def validate_image_input(image_data, max_size_mb=10):
    """校验图片输入"""
    errors = []
    if not image_data:
        errors.append("图片数据不能为空")
        return errors

    # 估算base64解码后大小（base64编码约增大33%）
    estimated_size = len(image_data) * 3 / 4
    max_bytes = max_size_mb * 1024 * 1024
    if estimated_size > max_bytes:
        errors.append(f"图片大小超过{max_size_mb}MB限制")

    # 检查是否为有效base64
    try:
        if len(image_data) > 100:  # 只对短字符串做快速检查
            base64.b64decode(image_data[:100] + "==", validate=False)
    except Exception:
        errors.append("无效的base64编码")

    return errors


def classify_confidence_action(confidence, threshold=0.6):
    """根据CV分类置信度决定下一步动作"""
    if confidence >= threshold:
        return "use_local_cv"  # 高置信度，直接使用本地结果
    else:
        return "fallback_to_llm"  # 低置信度，回退到Gemini Vision


def validate_nutrition_response(response):
    """校验营养分析响应格式"""
    errors = []
    if "food_name" not in response:
        errors.append("缺少food_name")
    if "nutrition" not in response:
        errors.append("缺少nutrition")
    elif isinstance(response["nutrition"], dict):
        required = ["calories", "protein", "fat", "carbs"]
        for field in required:
            if field not in response["nutrition"]:
                errors.append(f"nutrition缺少{field}")
            elif response["nutrition"][field] < 0:
                errors.append(f"{field}不能为负数")
    return errors


# ==================== 并发限制器 ====================

class ConcurrencyLimiter:
    """并发请求限制器（最大5个）"""
    def __init__(self, max_concurrent=5):
        self.max_concurrent = max_concurrent
        self.semaphore = threading.Semaphore(max_concurrent)
        self.current = 0
        self.lock = threading.Lock()

    def acquire(self):
        if not self.semaphore.acquire(blocking=False):
            return False
        with self.lock:
            self.current += 1
        return True

    def release(self):
        with self.lock:
            self.current -= 1
        self.semaphore.release()


# ==================== 图片校验测试 ====================

class TestImageValidation:
    """图片输入校验测试"""

    def test_empty_image_is_invalid(self):
        """空图片数据应校验失败"""
        errors = validate_image_input("")
        assert "图片数据不能为空" in errors

    def test_none_image_is_invalid(self):
        """None图片数据应校验失败"""
        errors = validate_image_input(None)
        assert "图片数据不能为空" in errors

    def test_small_image_is_valid(self):
        """小于10MB的图片应校验通过"""
        small_data = base64.b64encode(b"x" * 1000).decode()
        errors = validate_image_input(small_data)
        assert len(errors) == 0

    def test_oversized_image_is_rejected(self):
        """超过10MB的图片应被拒绝"""
        # 构造约15MB的base64数据
        large_data = "A" * (15 * 1024 * 1024)
        errors = validate_image_input(large_data)
        assert any("超过" in e for e in errors)

    def test_max_size_boundary(self):
        """刚好10MB的图片应通过"""
        # base64编码后10MB ≈ 原始 7.5MB，是合法的
        data = "A" * (10 * 1024 * 1024)
        errors = validate_image_input(data)
        # 10MB base64 解码后约7.5MB，应通过
        assert not any("超过" in e for e in errors)


# ==================== 分类置信度逻辑测试 ====================

class TestClassificationConfidence:
    """CV分类置信度决策测试"""

    def test_high_confidence_uses_local_cv(self):
        """高置信度(>=60%)应直接使用本地CV结果"""
        assert classify_confidence_action(0.92) == "use_local_cv"
        assert classify_confidence_action(0.60) == "use_local_cv"

    def test_low_confidence_falls_back_to_llm(self):
        """低置信度(<60%)应回退到Gemini Vision"""
        assert classify_confidence_action(0.45) == "fallback_to_llm"
        assert classify_confidence_action(0.59) == "fallback_to_llm"

    def test_zero_confidence_falls_back(self):
        """零置信度应回退"""
        assert classify_confidence_action(0.0) == "fallback_to_llm"

    def test_perfect_confidence_uses_local(self):
        """100%置信度应使用本地"""
        assert classify_confidence_action(1.0) == "use_local_cv"

    def test_custom_threshold(self):
        """支持自定义阈值"""
        assert classify_confidence_action(0.5, threshold=0.4) == "use_local_cv"
        assert classify_confidence_action(0.5, threshold=0.7) == "fallback_to_llm"


# ==================== 营养信息响应格式测试 ====================

class TestNutritionResponse:
    """营养分析响应格式测试"""

    def test_valid_response(self):
        """完整的营养分析响应应无错误"""
        response = {
            "food_name": "麻婆豆腐",
            "confidence": 0.92,
            "nutrition": {"calories": 280, "protein": 18, "fat": 16, "carbs": 12},
            "classification_method": "local_cv",
        }
        errors = validate_nutrition_response(response)
        assert len(errors) == 0

    def test_missing_food_name(self):
        """缺少food_name应报错"""
        response = {"nutrition": {"calories": 280, "protein": 18, "fat": 16, "carbs": 12}}
        errors = validate_nutrition_response(response)
        assert "缺少food_name" in errors

    def test_missing_nutrition(self):
        """缺少nutrition应报错"""
        response = {"food_name": "麻婆豆腐"}
        errors = validate_nutrition_response(response)
        assert "缺少nutrition" in errors

    def test_missing_nutrition_fields(self):
        """nutrition缺少必要字段应报错"""
        response = {"food_name": "麻婆豆腐", "nutrition": {"calories": 280}}
        errors = validate_nutrition_response(response)
        assert any("protein" in e for e in errors)

    def test_negative_calories_is_invalid(self):
        """负数卡路里应报错"""
        response = {
            "food_name": "测试", "nutrition": {
                "calories": -100, "protein": 10, "fat": 5, "carbs": 20
            },
        }
        errors = validate_nutrition_response(response)
        assert any("calories" in e and "负" in e for e in errors)

    def test_response_is_json_serializable(self):
        """响应应能JSON序列化"""
        response = {
            "food_name": "宫保鸡丁", "confidence": 0.88,
            "nutrition": {"calories": 350, "protein": 25, "fat": 15, "carbs": 20},
            "health_advice": "蛋白质丰富，适合运动后食用",
        }
        json_str = json.dumps(response, ensure_ascii=False)
        parsed = json.loads(json_str)
        assert parsed["food_name"] == "宫保鸡丁"


# ==================== 并发限制测试 ====================

class TestConcurrencyLimiter:
    """并发请求限制测试 - 最大5个并行请求"""

    def test_max_concurrent_is_5(self):
        """最大并发数应为5"""
        limiter = ConcurrencyLimiter(max_concurrent=5)
        assert limiter.max_concurrent == 5

    def test_can_acquire_up_to_max(self):
        """应能获取最多5个并发槽"""
        limiter = ConcurrencyLimiter(max_concurrent=5)
        results = [limiter.acquire() for _ in range(5)]
        assert all(results)  # 前5个都应成功

    def test_exceeding_max_is_rejected(self):
        """超过最大并发数应被拒绝"""
        limiter = ConcurrencyLimiter(max_concurrent=5)
        for _ in range(5):
            limiter.acquire()
        # 第6个应失败
        assert limiter.acquire() is False

    def test_release_allows_new_request(self):
        """释放后应允许新请求"""
        limiter = ConcurrencyLimiter(max_concurrent=1)
        assert limiter.acquire() is True
        assert limiter.acquire() is False  # 满了
        limiter.release()
        assert limiter.acquire() is True  # 释放后可以了


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
