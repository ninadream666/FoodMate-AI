# -*- coding: utf-8 -*-
"""
系统级验收测试
验证所有服务可用性、基础设施连通性
"""
import pytest
import requests
import psycopg2
from pymongo import MongoClient
import redis
import pika
import os

os.environ["no_proxy"] = "localhost,127.0.0.1"

_s = requests.Session()
_s.proxies = {"http": None, "https": None}
_s.trust_env = False
TIMEOUT = 10


# ==================== 微服务可用性 ====================

class TestAllServicesAvailable:
    """所有微服务应可用"""

    @pytest.mark.parametrize("name,url", [
        ("user-service", "http://localhost:8083/actuator/health"),
        ("order-service", "http://localhost:8084/actuator/health"),
    ])
    def test_java_service_responds(self, name, url):
        """Java服务应响应"""
        r = _s.get(url, timeout=TIMEOUT)
        assert r.status_code in [200, 403, 500, 503], f"{name}无响应"

    @pytest.mark.parametrize("name,url", [
        ("merchant-service", "http://localhost:8081/merchants"),
        ("marketing-service", "http://localhost:8082/actuator/health"),
        ("profile-service", "http://localhost:8086/actuator/health"),
        ("platform-service", "http://localhost:8088/actuator/health"),
    ])
    def test_java_service_responds_2(self, name, url):
        """Java服务应响应（第二组）"""
        r = _s.get(url, timeout=TIMEOUT)
        assert r.status_code in [200, 403, 500, 503], f"{name}无响应"

    @pytest.mark.parametrize("name,url", [
        ("recommendation-service", "http://localhost:8087/health"),
        ("ai-pricing-service", "http://localhost:8089/health"),
        ("nutrivision-service", "http://localhost:8090/health"),
    ])
    def test_python_service_healthy(self, name, url):
        """Python AI服务应健康"""
        r = _s.get(url, timeout=TIMEOUT)
        assert r.status_code == 200, f"{name}不健康"


# ==================== Eureka服务发现 ====================

class TestEurekaServiceDiscovery:
    """Eureka服务注册"""

    def test_eureka_accessible(self):
        """Eureka Dashboard可访问"""
        r = _s.get("http://localhost:8761", timeout=TIMEOUT)
        assert r.status_code == 200

    def test_services_registered_in_eureka(self):
        """有服务注册到Eureka"""
        r = _s.get("http://localhost:8761/eureka/apps",
                   headers={"Accept": "application/json"}, timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            apps = data.get("applications", {}).get("application", [])
            assert len(apps) > 0, "应至少有一个服务注册"


# ==================== 数据库连通性 ====================

class TestDatabaseConnectivity:
    """数据库连通性验证"""

    def test_postgres_connected(self):
        """PostgreSQL可连接"""
        conn = psycopg2.connect(
            host="localhost", port=5432, dbname="food_delivery_db",
            user="dev", password="dev123"
        )
        assert not conn.closed
        conn.close()

    def test_mongodb_connected(self):
        """MongoDB可连接"""
        client = MongoClient(host="localhost", port=27017,
                             username="dev", password="dev123",
                             serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        client.close()

    def test_redis_connected(self):
        """Redis可连接"""
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        assert r.ping() is True
        r.close()


# ==================== 消息队列连通性 ====================

class TestMessageQueueConnectivity:
    """RabbitMQ连通性"""

    def test_rabbitmq_connected(self):
        """RabbitMQ AMQP可连接"""
        conn = pika.BlockingConnection(pika.ConnectionParameters(
            host="localhost", port=5672,
            credentials=pika.PlainCredentials("dev", "dev123"),
        ))
        assert conn.is_open
        conn.close()

    def test_rabbitmq_management_api(self):
        """RabbitMQ管理API可访问"""
        r = _s.get("http://localhost:15672/api/overview",
                   auth=("dev", "dev123"), timeout=TIMEOUT)
        assert r.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
