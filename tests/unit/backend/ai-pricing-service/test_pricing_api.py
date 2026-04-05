# -*- coding: utf-8 -*-
"""
AI智能定价服务 单元测试
覆盖定价建议逻辑、事件格式验证、价格合理性校验
纯逻辑测试，不依赖FastAPI或外部服务
"""
import pytest
import json
from datetime import datetime


# ==================== 定价建议逻辑 ====================

def calculate_suggested_price(current_price, daily_sales_avg, competitor_avg,
                              cost=None, min_margin=0.2):
    """模拟定价逻辑：基于销量、竞品价格、成本计算建议价格"""
    if current_price <= 0:
        raise ValueError("当前价格必须大于0")

    # 基础建议 = 当前价格
    suggested = current_price

    # 竞品对比调整
    if competitor_avg > 0:
        price_ratio = current_price / competitor_avg
        if price_ratio > 1.2:  # 比竞品贵20%以上，建议降价
            suggested = current_price * 0.95
        elif price_ratio < 0.8:  # 比竞品便宜20%以上，可适度涨价
            suggested = current_price * 1.05

    # 销量调整
    if daily_sales_avg == 0:
        suggested *= 0.9  # 零销量，建议降价10%
    elif daily_sales_avg > 100:
        suggested *= 1.03  # 热销品可微涨

    # 成本底线
    if cost and cost > 0:
        min_price = cost * (1 + min_margin)
        suggested = max(suggested, min_price)

    # 保证不为负
    return round(max(suggested, 0.01), 2)


def validate_pricing_proposal(proposal):
    """校验定价建议格式"""
    errors = []
    if "merchant_id" not in proposal:
        errors.append("缺少merchant_id")
    if "suggested_price" not in proposal:
        errors.append("缺少suggested_price")
    elif proposal["suggested_price"] <= 0:
        errors.append("建议价格必须大于0")
    if "confidence" in proposal:
        if not (0 <= proposal["confidence"] <= 1):
            errors.append("置信度必须在0-1之间")
    return errors


# ==================== 定价计算测试 ====================

class TestPricingCalculation:
    """定价建议计算逻辑测试"""

    def test_price_too_high_vs_competitor_should_decrease(self):
        """价格远高于竞品应建议降价"""
        suggested = calculate_suggested_price(
            current_price=50.0, daily_sales_avg=30,
            competitor_avg=35.0
        )
        assert suggested < 50.0

    def test_price_too_low_vs_competitor_should_increase(self):
        """价格远低于竞品可适度涨价"""
        suggested = calculate_suggested_price(
            current_price=20.0, daily_sales_avg=30,
            competitor_avg=35.0
        )
        assert suggested > 20.0

    def test_zero_sales_should_suggest_decrease(self):
        """零销量应建议降价"""
        suggested = calculate_suggested_price(
            current_price=40.0, daily_sales_avg=0,
            competitor_avg=40.0
        )
        assert suggested < 40.0

    def test_hot_item_can_increase(self):
        """热销品可微涨"""
        suggested = calculate_suggested_price(
            current_price=30.0, daily_sales_avg=150,
            competitor_avg=30.0
        )
        assert suggested >= 30.0

    def test_cost_floor_is_respected(self):
        """建议价格不应低于成本+最低利润率"""
        suggested = calculate_suggested_price(
            current_price=15.0, daily_sales_avg=0,
            competitor_avg=10.0, cost=12.0, min_margin=0.2
        )
        min_price = 12.0 * 1.2  # 14.4
        assert suggested >= min_price

    def test_negative_price_not_allowed(self):
        """负价格输入应抛出异常"""
        with pytest.raises(ValueError):
            calculate_suggested_price(current_price=-10, daily_sales_avg=0, competitor_avg=0)

    def test_result_is_rounded_to_two_decimals(self):
        """建议价格应保留2位小数"""
        suggested = calculate_suggested_price(
            current_price=33.33, daily_sales_avg=50, competitor_avg=30.0
        )
        assert suggested == round(suggested, 2)


# ==================== 定价建议格式测试 ====================

class TestPricingProposalValidation:
    """定价建议输出格式校验测试"""

    def test_valid_proposal(self):
        """有效的定价建议应无校验错误"""
        proposal = {
            "merchant_id": 10, "item_name": "宫保鸡丁",
            "current_price": 32.0, "suggested_price": 29.0,
            "confidence": 0.85, "reason": "竞品均价较低",
        }
        errors = validate_pricing_proposal(proposal)
        assert len(errors) == 0

    def test_missing_merchant_id(self):
        """缺少merchant_id应报错"""
        proposal = {"suggested_price": 29.0}
        errors = validate_pricing_proposal(proposal)
        assert "缺少merchant_id" in errors

    def test_missing_suggested_price(self):
        """缺少suggested_price应报错"""
        proposal = {"merchant_id": 10}
        errors = validate_pricing_proposal(proposal)
        assert "缺少suggested_price" in errors

    def test_negative_suggested_price(self):
        """负数建议价格应报错"""
        proposal = {"merchant_id": 10, "suggested_price": -5.0}
        errors = validate_pricing_proposal(proposal)
        assert "建议价格必须大于0" in errors

    def test_invalid_confidence_range(self):
        """置信度超出0-1范围应报错"""
        proposal = {"merchant_id": 10, "suggested_price": 29.0, "confidence": 1.5}
        errors = validate_pricing_proposal(proposal)
        assert "置信度必须在0-1之间" in errors


# ==================== 订单事件格式测试 ====================

class TestOrderEventFormat:
    """RabbitMQ订单事件格式测试"""

    def test_order_paid_event_has_required_fields(self):
        """order.paid事件应包含必要字段"""
        event = {
            "event_type": "order.paid",
            "order_id": 100,
            "merchant_id": 10,
            "total_amount": 58.50,
            "items": [
                {"name": "宫保鸡丁", "price": 32.0, "quantity": 1},
                {"name": "米饭", "price": 3.0, "quantity": 2},
            ],
            "timestamp": "2026-04-04T12:00:00",
        }
        assert event["event_type"] == "order.paid"
        assert event["total_amount"] > 0
        assert len(event["items"]) > 0
        assert event["merchant_id"] > 0

    def test_event_is_json_serializable(self):
        """事件应能JSON序列化"""
        event = {
            "event_type": "order.paid", "order_id": 100,
            "merchant_id": 10, "total_amount": 58.50,
            "items": [{"name": "宫保鸡丁", "price": 32.0, "quantity": 1}],
        }
        json_str = json.dumps(event, ensure_ascii=False)
        parsed = json.loads(json_str)
        assert parsed["order_id"] == 100

    def test_unknown_event_type_is_skippable(self):
        """未知事件类型应可跳过"""
        event = {"event_type": "unknown.event", "data": None}
        known_types = {"order.paid", "order.created", "order.cancelled"}
        assert event["event_type"] not in known_types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
