# -*- coding: utf-8 -*-
"""
MongoDB 真实集成测试
直连 MongoDB，验证用户画像集合的CRUD、文档结构、数组操作
连接信息: localhost:27017, user=dev, password=dev123
"""
import pytest
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import time

MONGO_CONFIG = {
    "host": "localhost",
    "port": 27017,
    "username": "dev",
    "password": "dev123",
}


@pytest.fixture(scope="module")
def db():
    """创建MongoDB连接"""
    try:
        client = MongoClient(**MONGO_CONFIG, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")  # 验证连接
        database = client["food_delivery_profile"]
        yield database
        client.close()
    except (ConnectionFailure, Exception) as e:
        pytest.skip(f"MongoDB 不可用: {e}")


@pytest.fixture
def test_collection(db):
    """创建测试集合，测试后清理"""
    coll = db["test_profiles_integration"]
    yield coll
    coll.drop()  # 测试后清理


# ==================== 连接验证 ====================

class TestMongoConnection:
    """MongoDB连接和基础验证"""

    def test_can_connect_to_mongodb(self, db):
        """应能成功连接到MongoDB"""
        assert db is not None

    def test_database_name_is_correct(self, db):
        """数据库名应为food_delivery_profile"""
        assert db.name == "food_delivery_profile"

    def test_can_list_collections(self, db):
        """应能列出集合"""
        collections = db.list_collection_names()
        assert isinstance(collections, list)


# ==================== 文档CRUD ====================

class TestDocumentCRUD:
    """用户画像文档CRUD测试"""

    def test_insert_profile_document(self, test_collection):
        """应能插入用户画像文档"""
        profile = {
            "userId": 99999,
            "preferences": ["川菜", "日料"],
            "allergies": ["花生"],
            "tags": ["测试用户"],
            "favoriteMerchantIds": [10, 20],
            "orderCount": 5,
            "totalSpent": 250.50,
        }
        result = test_collection.insert_one(profile)
        assert result.inserted_id is not None

    def test_find_profile_by_userId(self, test_collection):
        """应能按userId查询画像"""
        test_collection.insert_one({"userId": 88888, "preferences": ["粤菜"]})

        found = test_collection.find_one({"userId": 88888})
        assert found is not None
        assert found["userId"] == 88888
        assert "粤菜" in found["preferences"]

    def test_update_preferences(self, test_collection):
        """应能更新用户偏好"""
        test_collection.insert_one({"userId": 77777, "preferences": ["川菜"]})

        test_collection.update_one(
            {"userId": 77777},
            {"$set": {"preferences": ["粤菜", "韩餐", "咖啡"]}}
        )

        updated = test_collection.find_one({"userId": 77777})
        assert "粤菜" in updated["preferences"]
        assert len(updated["preferences"]) == 3

    def test_delete_profile(self, test_collection):
        """应能删除用户画像"""
        test_collection.insert_one({"userId": 66666, "preferences": []})

        result = test_collection.delete_one({"userId": 66666})
        assert result.deleted_count == 1

        found = test_collection.find_one({"userId": 66666})
        assert found is None


# ==================== 数组操作 ====================

class TestArrayOperations:
    """MongoDB数组操作测试（$addToSet, $push等）"""

    def test_addToSet_prevents_duplicates(self, test_collection):
        """$addToSet应防止重复添加"""
        test_collection.insert_one({
            "userId": 55555,
            "allergies": ["花生", "海鲜"]
        })

        # 添加已存在的过敏原
        test_collection.update_one(
            {"userId": 55555},
            {"$addToSet": {"allergies": "花生"}}
        )
        doc = test_collection.find_one({"userId": 55555})
        assert doc["allergies"].count("花生") == 1  # 不重复

    def test_addToSet_adds_new_item(self, test_collection):
        """$addToSet应能添加新元素"""
        test_collection.insert_one({
            "userId": 44444,
            "allergies": ["花生"]
        })

        test_collection.update_one(
            {"userId": 44444},
            {"$addToSet": {"allergies": "乳制品"}}
        )
        doc = test_collection.find_one({"userId": 44444})
        assert "乳制品" in doc["allergies"]
        assert len(doc["allergies"]) == 2

    def test_push_adds_to_browse_history(self, test_collection):
        """$push应添加浏览记录"""
        test_collection.insert_one({
            "userId": 33333,
            "browseHistory": []
        })

        test_collection.update_one(
            {"userId": 33333},
            {"$push": {"browseHistory": {
                "merchantId": 10,
                "merchantName": "川味观",
                "timestamp": int(time.time())
            }}}
        )
        doc = test_collection.find_one({"userId": 33333})
        assert len(doc["browseHistory"]) == 1
        assert doc["browseHistory"][0]["merchantId"] == 10


# ==================== 灵活Schema验证 ====================

class TestFlexibleSchema:
    """MongoDB灵活Schema特性验证"""

    def test_different_documents_can_have_different_fields(self, test_collection):
        """不同文档可以有不同字段"""
        # 用户A有健康数据
        test_collection.insert_one({
            "userId": 11111, "preferences": ["川菜"],
            "healthRecords": [{"steps": 8000}]
        })
        # 用户B没有健康数据但有标签
        test_collection.insert_one({
            "userId": 22222, "preferences": ["日料"],
            "tags": ["素食主义者"]
        })

        doc_a = test_collection.find_one({"userId": 11111})
        doc_b = test_collection.find_one({"userId": 22222})

        assert "healthRecords" in doc_a
        assert "healthRecords" not in doc_b
        assert "tags" in doc_b

    def test_nested_document_support(self, test_collection):
        """应支持嵌套文档"""
        test_collection.insert_one({
            "userId": 10001,
            "healthRecord": {
                "dietary": {"restrictions": ["低糖", "低盐"], "calorieTarget": 2000},
                "fitness": {"steps": 8000, "activeMinutes": 45}
            }
        })

        doc = test_collection.find_one({"userId": 10001})
        assert doc["healthRecord"]["dietary"]["calorieTarget"] == 2000
        assert doc["healthRecord"]["fitness"]["steps"] == 8000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
