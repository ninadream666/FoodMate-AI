# -*- coding: utf-8 -*-
"""
推荐服务 API 单元测试
覆盖请求参数构建、响应格式校验、健康/天气/过敏原上下文处理逻辑
纯逻辑测试，不依赖FastAPI或外部服务
"""
import pytest
import json


# ==================== 请求参数构建逻辑 ====================

def build_recommend_request(user_id, location=None, query="推荐美食",
                            max_results=10, health_context=None,
                            weather_context=None, allergies=None):
    """构建推荐请求体（复刻 recommendationService.js 的 getV2Recommendations 逻辑）"""
    body = {
        "user_id": str(user_id) if user_id else "",
        "location": location or {"address": "当前位置", "latitude": 0, "longitude": 0},
        "query": query,
        "max_results": int(max_results),
    }
    if health_context is not None:
        hc = health_context
        body["health_context"] = {
            "daily_steps": hc.get("daily_steps", hc.get("dailySteps", 0)),
            "recent_steps_30min": hc.get("recent_steps_30min", hc.get("recentSteps30min", 0)),
            "heart_rate": hc.get("heart_rate", hc.get("heartRate", 75)),
            "activity_status": hc.get("activity_status", hc.get("activityStatus", "still")),
            "is_post_workout": hc.get("is_post_workout", hc.get("isPostWorkout", False)),
        }
    if weather_context is not None:
        wc = weather_context
        body["weather_context"] = {
            "condition": wc.get("condition", "晴"),
            "temperature": wc.get("temperature", 25),
            "humidity": wc.get("humidity", 50),
            "wind_speed": wc.get("wind_speed", wc.get("windSpeed", 10)),
            "is_raining": wc.get("is_raining", wc.get("isRaining", False)),
            "is_heavy_rain": wc.get("is_heavy_rain", wc.get("isHeavyRain", False)),
            "delivery_impact": wc.get("delivery_impact", wc.get("deliveryImpact", "none")),
        }
    if allergies and len(allergies) > 0:
        body["allergies"] = allergies
    return body


def validate_recommend_request(body):
    """校验推荐请求参数有效性"""
    errors = []
    if not body.get("user_id"):
        errors.append("user_id不能为空")
    if not body.get("location"):
        errors.append("location不能为空")
    max_r = body.get("max_results", 10)
    if max_r <= 0 or max_r > 50:
        errors.append("max_results应在1-50之间")
    return errors


# ==================== 基础请求构建测试 ====================

class TestBuildRecommendRequest:
    """推荐请求构建逻辑测试"""

    def test_basic_request_has_required_fields(self):
        """基础请求应包含user_id, location, query, max_results"""
        body = build_recommend_request(user_id="1")
        assert body["user_id"] == "1"
        assert "location" in body
        assert body["query"] == "推荐美食"
        assert body["max_results"] == 10

    def test_location_is_correctly_set(self):
        """位置信息应正确传递"""
        loc = {"address": "上海市浦东新区", "latitude": 31.2304, "longitude": 121.4737}
        body = build_recommend_request(user_id="1", location=loc)
        assert body["location"]["latitude"] == 31.2304
        assert body["location"]["longitude"] == 121.4737
        assert body["location"]["address"] == "上海市浦东新区"

    def test_user_id_is_always_string(self):
        """user_id应始终为字符串类型"""
        body = build_recommend_request(user_id=123)
        assert isinstance(body["user_id"], str)
        assert body["user_id"] == "123"

    def test_max_results_is_always_int(self):
        """max_results应始终为整数"""
        body = build_recommend_request(user_id="1", max_results="5")
        assert isinstance(body["max_results"], int)
        assert body["max_results"] == 5

    def test_default_location_when_not_provided(self):
        """未提供位置时应使用默认值"""
        body = build_recommend_request(user_id="1")
        assert body["location"]["address"] == "当前位置"
        assert body["location"]["latitude"] == 0


# ==================== 健康上下文测试 ====================

class TestHealthContext:
    """健康上下文处理逻辑测试"""

    def test_health_context_with_camelCase_keys(self):
        """应支持前端camelCase字段名"""
        body = build_recommend_request(user_id="1", health_context={
            "dailySteps": 8000,
            "recentSteps30min": 500,
            "heartRate": 85,
            "activityStatus": "walking",
            "isPostWorkout": True,
        })
        hc = body["health_context"]
        assert hc["daily_steps"] == 8000
        assert hc["recent_steps_30min"] == 500
        assert hc["heart_rate"] == 85
        assert hc["activity_status"] == "walking"
        assert hc["is_post_workout"] is True

    def test_health_context_with_snake_case_keys(self):
        """应支持后端snake_case字段名"""
        body = build_recommend_request(user_id="1", health_context={
            "daily_steps": 5000,
            "heart_rate": 70,
            "activity_status": "still",
            "is_post_workout": False,
        })
        hc = body["health_context"]
        assert hc["daily_steps"] == 5000
        assert hc["heart_rate"] == 70

    def test_health_context_defaults(self):
        """健康上下文缺失字段应有默认值"""
        body = build_recommend_request(user_id="1", health_context={})
        hc = body["health_context"]
        assert hc["daily_steps"] == 0
        assert hc["heart_rate"] == 75  # 默认正常心率
        assert hc["activity_status"] == "still"
        assert hc["is_post_workout"] is False

    def test_no_health_context_means_no_field(self):
        """不提供健康上下文时请求体不应包含health_context"""
        body = build_recommend_request(user_id="1")
        assert "health_context" not in body


# ==================== 天气上下文测试 ====================

class TestWeatherContext:
    """天气上下文处理逻辑测试"""

    def test_weather_context_rain_scenario(self):
        """暴雨天气上下文应正确设置"""
        body = build_recommend_request(user_id="1", weather_context={
            "condition": "暴雨", "temperature": 12, "humidity": 95,
            "wind_speed": 35, "is_raining": True, "is_heavy_rain": True,
            "delivery_impact": "severe",
        })
        wc = body["weather_context"]
        assert wc["condition"] == "暴雨"
        assert wc["is_heavy_rain"] is True
        assert wc["delivery_impact"] == "severe"

    def test_weather_context_defaults(self):
        """天气上下文缺失字段应有默认值"""
        body = build_recommend_request(user_id="1", weather_context={})
        wc = body["weather_context"]
        assert wc["condition"] == "晴"
        assert wc["temperature"] == 25
        assert wc["is_raining"] is False

    def test_no_weather_context_means_no_field(self):
        """不提供天气上下文时不应包含weather_context"""
        body = build_recommend_request(user_id="1")
        assert "weather_context" not in body


# ==================== 过敏原测试 ====================

class TestAllergies:
    """过敏原/忌口处理逻辑测试"""

    def test_allergies_are_passed_through(self):
        """过敏原列表应正确传递"""
        body = build_recommend_request(user_id="1", allergies=["花生", "海鲜", "乳制品"])
        assert body["allergies"] == ["花生", "海鲜", "乳制品"]

    def test_empty_allergies_not_included(self):
        """空过敏原列表不应包含allergies字段"""
        body = build_recommend_request(user_id="1", allergies=[])
        assert "allergies" not in body

    def test_none_allergies_not_included(self):
        """None过敏原不应包含allergies字段"""
        body = build_recommend_request(user_id="1", allergies=None)
        assert "allergies" not in body


# ==================== 请求参数校验测试 ====================

class TestRequestValidation:
    """请求参数校验测试"""

    def test_empty_user_id_is_invalid(self):
        """空user_id应校验失败"""
        body = build_recommend_request(user_id="")
        errors = validate_recommend_request(body)
        assert "user_id不能为空" in errors

    def test_valid_request_has_no_errors(self):
        """有效请求应无校验错误"""
        body = build_recommend_request(user_id="1")
        errors = validate_recommend_request(body)
        assert len(errors) == 0

    def test_request_is_json_serializable(self):
        """请求体应能正确序列化为JSON"""
        body = build_recommend_request(
            user_id="1",
            health_context={"daily_steps": 8000, "heart_rate": 85},
            weather_context={"condition": "晴", "temperature": 28},
            allergies=["花生"],
        )
        json_str = json.dumps(body, ensure_ascii=False)
        parsed = json.loads(json_str)
        assert parsed["user_id"] == "1"
        assert parsed["health_context"]["daily_steps"] == 8000
        assert parsed["allergies"] == ["花生"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
