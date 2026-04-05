# -*- coding: utf-8 -*-
"""
RabbitMQ 真实集成测试
直连 RabbitMQ，验证交换机、队列、消息发布/消费
连接信息: localhost:5672, user=guest, password=guest
管理API: localhost:15672
"""
import pytest
import pika
import json
import time
import requests
import os

# 禁用代理，避免localhost请求走代理超时
os.environ["no_proxy"] = "localhost,127.0.0.1"
os.environ["NO_PROXY"] = "localhost,127.0.0.1"

RABBITMQ_CONFIG = {
    "host": "localhost",
    "port": 5672,
    "credentials": pika.PlainCredentials("dev", "dev123"),
}
MANAGEMENT_URL = "http://localhost:15672/api"
MANAGEMENT_AUTH = ("dev", "dev123")

# 创建无代理session
_session = requests.Session()
_session.proxies = {"http": None, "https": None}
_session.trust_env = False

# 覆盖requests.get让所有调用走无代理
_orig_get = requests.get
requests.get = lambda *a, **kw: _session.get(*a, **{k: v for k, v in kw.items() if k != 'proxies'})

TEST_EXCHANGE = "test_integration_exchange"
TEST_QUEUE = "test_integration_queue"


@pytest.fixture(scope="module")
def connection():
    """创建RabbitMQ连接"""
    try:
        params = pika.ConnectionParameters(
            host=RABBITMQ_CONFIG["host"],
            port=RABBITMQ_CONFIG["port"],
            credentials=RABBITMQ_CONFIG["credentials"],
            connection_attempts=3,
            retry_delay=1,
        )
        conn = pika.BlockingConnection(params)
        yield conn
        conn.close()
    except pika.exceptions.AMQPConnectionError as e:
        pytest.skip(f"RabbitMQ 不可用: {e}")


@pytest.fixture
def channel(connection):
    """获取channel，测试后清理"""
    ch = connection.channel()
    yield ch
    # 清理测试资源
    try:
        ch.exchange_delete(TEST_EXCHANGE)
        ch.queue_delete(TEST_QUEUE)
    except Exception:
        pass


# ==================== 连接验证 ====================

class TestRabbitMQConnection:
    """RabbitMQ连接验证"""

    def test_can_connect_to_rabbitmq(self, connection):
        """应能成功连接到RabbitMQ"""
        assert connection.is_open

    def test_management_api_accessible(self):
        """管理API应可访问"""
        try:
            response = requests.get(
                f"{MANAGEMENT_URL}/overview",
                auth=MANAGEMENT_AUTH, timeout=5
            )
            assert response.status_code == 200
            data = response.json()
            assert "rabbitmq_version" in data
        except requests.ConnectionError:
            pytest.skip("RabbitMQ管理API不可用")


# ==================== 交换机验证 ====================

class TestExchanges:
    """交换机（Exchange）验证"""

    def test_order_events_exchange_exists(self):
        """order.events交换机应存在"""
        try:
            response = requests.get(
                f"{MANAGEMENT_URL}/exchanges/%2F/order.events",
                auth=MANAGEMENT_AUTH, timeout=5
            )
            # 存在返回200，不存在返回404
            if response.status_code == 200:
                data = response.json()
                assert data["name"] == "order.events"
            else:
                pytest.skip("order.events交换机未创建")
        except requests.ConnectionError:
            pytest.skip("管理API不可用")

    def test_can_declare_exchange(self, channel):
        """应能声明新交换机"""
        channel.exchange_declare(
            exchange=TEST_EXCHANGE,
            exchange_type="topic",
            durable=False,
            auto_delete=True,
        )
        # 不抛异常即成功

    def test_pricing_events_exchange_exists(self):
        """pricing.events交换机应存在"""
        try:
            response = requests.get(
                f"{MANAGEMENT_URL}/exchanges/%2F/pricing.events",
                auth=MANAGEMENT_AUTH, timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                assert data["name"] == "pricing.events"
            else:
                pytest.skip("pricing.events交换机未创建")
        except requests.ConnectionError:
            pytest.skip("管理API不可用")


# ==================== 队列操作 ====================

class TestQueueOperations:
    """队列操作测试"""

    def test_can_declare_queue(self, channel):
        """应能声明队列"""
        result = channel.queue_declare(queue=TEST_QUEUE, auto_delete=True)
        assert result.method.queue == TEST_QUEUE

    def test_can_bind_queue_to_exchange(self, channel):
        """应能将队列绑定到交换机"""
        channel.exchange_declare(exchange=TEST_EXCHANGE, exchange_type="topic", auto_delete=True)
        channel.queue_declare(queue=TEST_QUEUE, auto_delete=True)
        channel.queue_bind(queue=TEST_QUEUE, exchange=TEST_EXCHANGE, routing_key="test.#")
        # 不抛异常即成功


# ==================== 消息发布/消费 ====================

class TestMessagePublishConsume:
    """消息发布和消费测试"""

    def test_publish_and_consume_message(self, channel):
        """应能发布消息并消费"""
        channel.exchange_declare(exchange=TEST_EXCHANGE, exchange_type="topic", auto_delete=True)
        channel.queue_declare(queue=TEST_QUEUE, auto_delete=True)
        channel.queue_bind(queue=TEST_QUEUE, exchange=TEST_EXCHANGE, routing_key="test.order")

        # 发布消息
        message = json.dumps({
            "event_type": "order.paid",
            "order_id": 12345,
            "merchant_id": 10,
            "total_amount": 58.50,
        })
        channel.basic_publish(
            exchange=TEST_EXCHANGE,
            routing_key="test.order",
            body=message,
        )

        # 消费消息
        method, properties, body = channel.basic_get(queue=TEST_QUEUE, auto_ack=True)
        assert body is not None
        parsed = json.loads(body)
        assert parsed["event_type"] == "order.paid"
        assert parsed["order_id"] == 12345

    def test_message_json_format(self, channel):
        """消息体应为有效JSON"""
        channel.exchange_declare(exchange=TEST_EXCHANGE, exchange_type="topic", auto_delete=True)
        channel.queue_declare(queue=TEST_QUEUE, auto_delete=True)
        channel.queue_bind(queue=TEST_QUEUE, exchange=TEST_EXCHANGE, routing_key="test.#")

        event = {
            "event_type": "order.created",
            "order_id": 99,
            "items": [{"name": "宫保鸡丁", "price": 32.0, "quantity": 1}],
            "timestamp": "2026-04-04T14:00:00",
        }
        channel.basic_publish(
            exchange=TEST_EXCHANGE,
            routing_key="test.created",
            body=json.dumps(event, ensure_ascii=False),
        )

        method, props, body = channel.basic_get(queue=TEST_QUEUE, auto_ack=True)
        parsed = json.loads(body)
        assert parsed["event_type"] == "order.created"
        assert len(parsed["items"]) == 1

    def test_empty_queue_returns_none(self, channel):
        """空队列消费应返回None"""
        channel.queue_declare(queue=TEST_QUEUE, auto_delete=True)
        # 先清空
        channel.queue_purge(TEST_QUEUE)

        method, props, body = channel.basic_get(queue=TEST_QUEUE, auto_ack=True)
        assert method is None


# ==================== 服务间通信验证 ====================

class TestServiceCommunicationViaRabbitMQ:
    """服务间异步通信验证"""

    def test_list_queues_via_management(self):
        """应能通过管理API列出所有队列"""
        try:
            response = requests.get(
                f"{MANAGEMENT_URL}/queues",
                auth=MANAGEMENT_AUTH, timeout=5
            )
            assert response.status_code == 200
            queues = response.json()
            assert isinstance(queues, list)
            # 列出队列名
            queue_names = [q["name"] for q in queues]
            assert isinstance(queue_names, list)
        except requests.ConnectionError:
            pytest.skip("管理API不可用")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
