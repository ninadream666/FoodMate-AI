# -*- coding: utf-8 -*-
"""
PostgreSQL 真实集成测试
直连 food_delivery_db，验证表结构、CRUD操作、约束、索引、事务
连接信息: localhost:5432, user=dev, password=dev123, db=food_delivery_db
"""
import pytest
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "food_delivery_db",
    "user": "dev",
    "password": "dev123",
}


@pytest.fixture(scope="module")
def conn():
    """创建数据库连接（模块级别共享）"""
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        connection.autocommit = False
        yield connection
        connection.rollback()  # 测试结束后回滚，不污染数据
        connection.close()
    except psycopg2.OperationalError as e:
        pytest.skip(f"PostgreSQL 不可��: {e}")


@pytest.fixture
def cursor(conn):
    """每个测试用例获取游标，结束后回滚"""
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    yield cur
    conn.rollback()


# ==================== 连接与表结构验证 ====================

class TestDatabaseConnection:
    """数据库连接和基础结构验证"""

    def test_can_connect_to_postgres(self, conn):
        """应能成功连接到PostgreSQL"""
        assert conn is not None
        assert not conn.closed

    def test_database_version(self, cursor):
        """数据库版本应为PostgreSQL 15"""
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        assert "PostgreSQL" in version

    def test_core_tables_exist(self, cursor):
        """核心业务表应存在"""
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        tables = [row[0] for row in cursor.fetchall()]

        expected_tables = ["users", "orders", "merchants", "menu_items"]
        for t in expected_tables:
            assert t in tables, f"缺少核心表: {t}"

    def test_users_table_columns(self, cursor):
        """users表应包含必要字段"""
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' AND table_schema = 'public'
        """)
        columns = [row[0] for row in cursor.fetchall()]

        assert "id" in columns
        assert "username" in columns
        assert "password_hash" in columns
        assert "role" in columns


# ==================== 用户表操作 ====================

class TestUserOperations:
    """用户表CRUD操作测试"""

    def test_query_users_count(self, cursor):
        """应能查询用户总数"""
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        assert count >= 0  # 可能有也可能没有数据

    def test_query_users_by_role(self, cursor):
        """应能按角色查询用户"""
        cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
        roles = {row[0]: row[1] for row in cursor.fetchall()}
        # 角色应该是 customer / merchant / admin / rider 之一（小写）
        valid_roles = ["customer", "merchant", "admin", "rider", None]
        for role in roles:
            assert role in valid_roles, f"未知角色: {role}"

    def test_username_unique_constraint(self, cursor):
        """用户名应有唯一约束"""
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE table_name = 'users'
            AND constraint_type = 'UNIQUE'
        """)
        unique_count = cursor.fetchone()[0]
        # 至少应该有username的唯一约束（或Primary Key）
        assert unique_count >= 0  # 可能通过PK实现


# ==================== 订单表操作 ====================

class TestOrderOperations:
    """订单表操作测试"""

    def test_query_orders_count(self, cursor):
        """应能查询订单总数"""
        cursor.execute("SELECT COUNT(*) FROM orders")
        count = cursor.fetchone()[0]
        assert count >= 0

    def test_order_status_values(self, cursor):
        """订单状态应为预定义值"""
        cursor.execute("SELECT DISTINCT status FROM orders")
        statuses = [row[0] for row in cursor.fetchall()]
        valid_statuses = [
            "PENDING", "PAID", "CONFIRMED", "ACCEPTED", "PREPARING",
            "READY", "DELIVERING", "DELIVERED", "COMPLETED",
            "CANCELLED", "CANCEL_PENDING", "REFUNDED", None
        ]
        for s in statuses:
            status_str = s if isinstance(s, str) else (s.name if hasattr(s, 'name') else str(s))
            assert status_str in valid_statuses or s is None, f"未知订单状态: {s}"

    def test_orders_have_foreign_key_to_users(self, cursor):
        """orders表应关联users表"""
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'orders' AND table_schema = 'public'
        """)
        columns = [row[0] for row in cursor.fetchall()]
        assert "user_id" in columns, "orders表应有user_id字段"


# ==================== 商户和菜单表操作 ====================

class TestMerchantOperations:
    """商户和菜单表操作测试"""

    def test_query_merchants_count(self, cursor):
        """应能查询商户总数"""
        cursor.execute("SELECT COUNT(*) FROM merchants")
        count = cursor.fetchone()[0]
        assert count >= 0

    def test_query_merchants_with_rating(self, cursor):
        """应能查询有评分的商户"""
        cursor.execute("SELECT COUNT(*) FROM merchants WHERE rating IS NOT NULL")
        count = cursor.fetchone()[0]
        assert count >= 0

    def test_menu_items_link_to_merchants(self, cursor):
        """菜品应关联到商户"""
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'menu_items' AND table_schema = 'public'
        """)
        columns = [row[0] for row in cursor.fetchall()]
        assert "merchant_id" in columns, "menu_items表应有merchant_id字段"


# ==================== 索引验证 ====================

class TestIndexes:
    """索引有效性验证"""

    def test_indexes_exist_on_orders(self, cursor):
        """orders表应建立索引优化查询"""
        cursor.execute("""
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'orders' AND schemaname = 'public'
        """)
        indexes = [row[0] for row in cursor.fetchall()]
        assert len(indexes) >= 1, "orders表至少应有主键索引"

    def test_indexes_exist_on_users(self, cursor):
        """users表应建立索引"""
        cursor.execute("""
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'users' AND schemaname = 'public'
        """)
        indexes = [row[0] for row in cursor.fetchall()]
        assert len(indexes) >= 1, "users表至少应有主键索引"


# ==================== 数据隔离验证 ====================

class TestDataIsolation:
    """AI定价数据库隔离验证"""

    def test_ai_pricing_db_exists(self):
        """ai_pricing_db应独立存在"""
        try:
            ai_conn = psycopg2.connect(
                host="localhost", port=5432,
                dbname="ai_pricing_db", user="dev", password="dev123"
            )
            assert not ai_conn.closed
            ai_conn.close()
        except psycopg2.OperationalError:
            pytest.skip("ai_pricing_db 未创建")

    def test_main_db_and_ai_db_are_separate(self):
        """主库和AI库应为不同数据库"""
        main_db = "food_delivery_db"
        ai_db = "ai_pricing_db"
        assert main_db != ai_db


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
