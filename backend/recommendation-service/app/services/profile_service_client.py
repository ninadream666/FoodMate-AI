"""
用户画像服务客户端
调用 profile-service 获取真实用户画像数据
"""

import os
import aiohttp
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    """用户画像数据结构"""
    username: str
    preferences: List[str]  # 偏好标签，如 ["辣", "川菜", "快餐"]
    allergies: List[str]  # 过敏/忌口，如 ["花生", "海鲜"]
    tags: List[str]  # 用户标签
    favorite_merchant_ids: List[int]  # 收藏的商家ID
    browse_history: List[Dict[str, Any]]  # 浏览历史
    stats: Optional[Dict[str, Any]] = None  # 用户统计信息


@dataclass
class OrderInfo:
    """订单信息"""
    order_id: int
    merchant_id: int
    merchant_name: str
    total_amount: float
    status: str
    created_at: str
    items: List[Dict[str, Any]]


@dataclass
class UserContext:
    """用户完整上下文（画像 + 订单历史）"""
    profile: UserProfile
    recent_orders: List[OrderInfo]


class ProfileServiceClient:
    """
    用户画像服务HTTP客户端
    用于调用 profile-service 获取用户数据
    """
    
    def __init__(self, base_url: str = None, timeout: int = 10):
        """
        初始化客户端
        
        Args:
            base_url: profile-service 的基础URL
            timeout: 请求超时时间（秒）
        """
        # 支持多种环境配置
        # Docker环境内部: http://profile-service:8080
        # 本地开发环境: http://localhost:8086
        self.base_url = base_url or os.getenv(
            "PROFILE_SERVICE_URL", 
            "http://profile-service:8080"  # Docker内部服务名
        )
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        logger.info(f"ProfileServiceClient initialized with base_url: {self.base_url}")
    
    async def get_user_profile(self, token: str) -> Optional[UserProfile]:
        """
        获取用户画像
        
        Args:
            token: JWT认证令牌（不含Bearer前缀）
            
        Returns:
            UserProfile 对象，失败返回 None
        """
        url = f"{self.base_url}/profile"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_profile(data)
                    elif response.status == 401:
                        logger.warning("获取用户画像失败: 未授权（Token无效或过期）")
                    elif response.status == 404:
                        logger.info("用户画像不存在，将创建新画像")
                    else:
                        logger.error(f"获取用户画像失败: HTTP {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"请求用户画像服务失败: {e}")
        except Exception as e:
            logger.error(f"获取用户画像时发生异常: {e}")
        
        return None
    
    async def get_user_context(self, token: str) -> Optional[UserContext]:
        """
        获取用户完整上下文（画像 + 订单历史）
        这是供AI Agent调用的聚合接口
        
        Args:
            token: JWT认证令牌（不含Bearer前缀）
            
        Returns:
            UserContext 对象，失败返回 None
        """
        url = f"{self.base_url}/profile/context"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_user_context(data)
                    elif response.status == 401:
                        logger.warning("获取用户上下文失败: 未授权")
                    else:
                        logger.error(f"获取用户上下文失败: HTTP {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"请求用户上下文服务失败: {e}")
        except Exception as e:
            logger.error(f"获取用户上下文时发生异常: {e}")
        
        return None
    
    async def get_user_favorites(self, token: str) -> List[int]:
        """
        获取用户收藏的商家列表
        
        Args:
            token: JWT认证令牌
            
        Returns:
            收藏的商家ID列表
        """
        url = f"{self.base_url}/profile/favorites"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
        except Exception as e:
            logger.error(f"获取收藏列表失败: {e}")
        
        return []
    
    async def get_browse_history(self, token: str) -> List[Dict[str, Any]]:
        """
        获取用户浏览历史
        
        Args:
            token: JWT认证令牌
            
        Returns:
            浏览历史记录列表
        """
        url = f"{self.base_url}/profile/history"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
        except Exception as e:
            logger.error(f"获取浏览历史失败: {e}")
        
        return []
    
    async def add_browse_history(self, token: str, merchant_id: int, 
                                  merchant_name: str = None) -> bool:
        """
        记录浏览历史
        
        Args:
            token: JWT认证令牌
            merchant_id: 商家ID
            merchant_name: 商家名称
            
        Returns:
            是否成功
        """
        url = f"{self.base_url}/profile/history"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data = {
            "merchantId": merchant_id,
            "merchantName": merchant_name or f"商家{merchant_id}",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(url, headers=headers, json=data) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"记录浏览历史失败: {e}")
        
        return False
    
    def _parse_profile(self, data: Dict[str, Any]) -> UserProfile:
        """解析用户画像数据"""
        return UserProfile(
            username=data.get("username", ""),
            preferences=data.get("preferences", []),
            allergies=data.get("allergies", []),
            tags=data.get("tags", []),
            favorite_merchant_ids=data.get("favoriteMerchantIds", []),
            browse_history=data.get("browseHistory", []),
            stats=data.get("stats")
        )
    
    def _parse_user_context(self, data: Dict[str, Any]) -> UserContext:
        """解析用户上下文数据"""
        profile_data = data.get("profile", {})
        orders_data = data.get("recentOrders", [])
        
        profile = self._parse_profile(profile_data)
        
        recent_orders = []
        for order in orders_data:
            recent_orders.append(OrderInfo(
                order_id=order.get("orderId", 0),
                merchant_id=order.get("merchantId", 0),
                merchant_name=order.get("merchantName", ""),
                total_amount=order.get("totalAmount", 0.0),
                status=order.get("status", ""),
                created_at=order.get("createdAt", ""),
                items=order.get("items", [])
            ))
        
        return UserContext(profile=profile, recent_orders=recent_orders)
    
    async def check_health(self) -> bool:
        """
        检查 profile-service 健康状态
        
        Returns:
            服务是否健康
        """
        try:
            # profile-service 应该有 /actuator/health 端点
            url = f"{self.base_url}/actuator/health"
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("status") == "UP"
        except Exception as e:
            logger.warning(f"profile-service 健康检查失败: {e}")
        
        return False


class ProfileServiceAdapter:
    """
    用户画像服务适配器
    提供与 ProfilerAgent 兼容的接口
    """
    
    def __init__(self, client: ProfileServiceClient = None):
        self.client = client or ProfileServiceClient()
        self._token_cache: Dict[str, str] = {}  # user_id -> token
    
    def set_token(self, user_id: str, token: str):
        """缓存用户Token"""
        self._token_cache[user_id] = token
    
    def get_token(self, user_id: str) -> Optional[str]:
        """获取用户Token"""
        return self._token_cache.get(user_id)
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        获取用户画像（供 ProfilerAgent 调用）
        
        Args:
            user_id: 用户ID或用户名
            
        Returns:
            用户画像字典，与 ProfilerAgent 预期格式一致
        """
        token = self.get_token(user_id)
        if not token:
            logger.warning(f"未找到用户 {user_id} 的Token，无法获取真实画像")
            return None
        
        context = await self.client.get_user_context(token)
        if not context:
            return None
        
        # 转换为 ProfilerAgent 预期的格式
        profile = context.profile
        
        # 从订单历史分析偏好菜系
        cuisine_stats = self._analyze_cuisine_from_orders(context.recent_orders)
        
        return {
            "user_id": user_id,
            "username": profile.username,
            "preferred_cuisines": profile.preferences or cuisine_stats.get("top_cuisines", []),
            "price_sensitivity": self._infer_price_sensitivity(context.recent_orders),
            "taste_profile": {
                "spicy_tolerance": "高" if "辣" in profile.preferences else "中",
                "preferences": profile.preferences,
                "allergies": profile.allergies
            },
            "behavioral_patterns": {
                "order_frequency": len(context.recent_orders),
                "avg_order_amount": cuisine_stats.get("avg_amount", 0),
                "favorite_merchants": profile.favorite_merchant_ids,
                "browse_history_count": len(profile.browse_history)
            },
            # 🆕 深度订单历史分析
            "order_history_analysis": self._analyze_order_patterns(context.recent_orders),
            # 🆕 浏览历史分析
            "browse_history_analysis": self._analyze_browse_history(profile.browse_history),
            "tags": profile.tags,
            "stats": profile.stats,
            "data_source": "profile-service"  # 标识数据来源为真实服务
        }

    def _analyze_order_patterns(self, orders: List[OrderInfo]) -> Dict[str, Any]:
        """
        深度分析订单历史模式
        
        提取：
        - 菜系订单频率分布
        - 时段订单分布
        - 工作日/周末分布
        - 复购餐厅列表
        - 历史高评分餐厅
        """
        if not orders:
            return {
                "cuisine_frequency": {},
                "time_pattern": {},
                "weekday_pattern": {},
                "reorder_merchants": {},
                "high_rated_cuisines": [],
                "order_items": []
            }
        
        cuisine_frequency = {}
        time_pattern = {"breakfast": 0, "lunch": 0, "dinner": 0, "night_snack": 0, "afternoon_tea": 0}
        weekday_pattern = {"weekday": 0, "weekend": 0}
        merchant_order_count = {}
        high_rated_cuisines = []
        order_items = []
        
        for order in orders:
            # 1. 统计菜系频率（从商家名称推断）
            cuisine_type = self._infer_cuisine_from_merchant(order.merchant_name)
            if cuisine_type:
                cuisine_frequency[cuisine_type] = cuisine_frequency.get(cuisine_type, 0) + 1
            
            # 2. 时段分析
            if order.created_at:
                try:
                    order_time = datetime.fromisoformat(order.created_at.replace('Z', '+00:00'))
                    hour = order_time.hour
                    
                    # 判断用餐时段
                    if 6 <= hour < 10:
                        time_pattern["breakfast"] += 1
                    elif 11 <= hour < 14:
                        time_pattern["lunch"] += 1
                    elif 14 <= hour < 17:
                        time_pattern["afternoon_tea"] += 1
                    elif 17 <= hour < 21:
                        time_pattern["dinner"] += 1
                    elif hour >= 21 or hour < 2:
                        time_pattern["night_snack"] += 1
                    
                    # 判断工作日/周末
                    if order_time.weekday() >= 5:
                        weekday_pattern["weekend"] += 1
                    else:
                        weekday_pattern["weekday"] += 1
                except (ValueError, AttributeError):
                    pass
            
            # 3. 统计商家复购
            merchant_key = str(order.merchant_id)
            merchant_order_count[merchant_key] = merchant_order_count.get(merchant_key, 0) + 1
            
            # 4. 构建订单项详情（用于智能评分）
            order_items.append({
                "order_id": str(order.order_id),
                "merchant_id": str(order.merchant_id),
                "merchant_name": order.merchant_name,
                "cuisine_type": cuisine_type,
                "total_amount": order.total_amount,
                "order_time": order.created_at,
                "rating": getattr(order, 'rating', 0.0),
                "is_reorder": merchant_order_count[merchant_key] > 1
            })
        
        # 5. 找出复购餐厅（订单>=2次）
        reorder_merchants = {k: v for k, v in merchant_order_count.items() if v >= 2}
        
        return {
            "cuisine_frequency": cuisine_frequency,
            "time_pattern": time_pattern,
            "weekday_pattern": weekday_pattern,
            "reorder_merchants": reorder_merchants,
            "high_rated_cuisines": high_rated_cuisines,
            "order_items": order_items
        }

    def _analyze_browse_history(self, browse_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        分析浏览历史
        
        提取：
        - 浏览商家列表及频次
        - 浏览菜系偏好
        - 浏览但未下单的商家（探索兴趣）
        """
        if not browse_history:
            return {
                "browse_items": [],
                "cuisine_interest": {},
                "browse_merchants": {}
            }
        
        browse_items = []
        cuisine_interest = {}
        merchant_browse_count = {}
        
        for item in browse_history:
            merchant_id = str(item.get("merchantId", ""))
            merchant_name = item.get("merchantName", "")
            
            # 统计商家浏览次数
            if merchant_id:
                merchant_browse_count[merchant_id] = merchant_browse_count.get(merchant_id, 0) + 1
            
            # 推断菜系并统计兴趣
            cuisine_type = self._infer_cuisine_from_merchant(merchant_name)
            if cuisine_type:
                cuisine_interest[cuisine_type] = cuisine_interest.get(cuisine_type, 0) + 1
            
            # 构建浏览项
            browse_items.append({
                "merchant_id": merchant_id,
                "merchant_name": merchant_name,
                "cuisine_type": cuisine_type,
                "browse_time": item.get("timestamp"),
                "browse_count": 1  # 单次记录，后续会聚合
            })
        
        # 聚合同一商家的浏览次数
        aggregated_items = {}
        for item in browse_items:
            mid = item["merchant_id"]
            if mid in aggregated_items:
                aggregated_items[mid]["browse_count"] += 1
            else:
                aggregated_items[mid] = item.copy()
                aggregated_items[mid]["browse_count"] = merchant_browse_count.get(mid, 1)
        
        return {
            "browse_items": list(aggregated_items.values()),
            "cuisine_interest": cuisine_interest,
            "browse_merchants": merchant_browse_count
        }

    def _infer_cuisine_from_merchant(self, merchant_name: str) -> str:
        """从商家名称推断菜系类型"""
        if not merchant_name:
            return ""
        
        cuisine_keywords = {
            "火锅": ["火锅", "涮锅", "海底捞", "呷哺"],
            "川菜": ["川", "麻辣", "重庆", "成都"],
            "粤菜": ["粤", "广式", "港式", "茶餐厅"],
            "湘菜": ["湘", "湖南"],
            "日料": ["日", "寿司", "拉面", "日式"],
            "韩餐": ["韩", "烤肉", "石锅"],
            "西餐": ["西餐", "牛排", "意面", "披萨"],
            "快餐": ["麦当劳", "肯德基", "汉堡", "炸鸡", "快餐"],
            "烧烤": ["烧烤", "烤串", "撸串"],
            "面食": ["面", "拉面", "米线", "粉"],
            "甜品": ["甜品", "蛋糕", "奶茶", "咖啡"],
        }
        
        for cuisine, keywords in cuisine_keywords.items():
            if any(kw in merchant_name for kw in keywords):
                return cuisine
        
        return "中餐"  # 默认
    
    def _analyze_cuisine_from_orders(self, orders: List[OrderInfo]) -> Dict[str, Any]:
        """从订单历史分析菜系偏好"""
        if not orders:
            return {"top_cuisines": [], "avg_amount": 0}
        
        # 统计商家和金额
        merchant_counts = {}
        total_amount = 0
        
        for order in orders:
            merchant_counts[order.merchant_name] = merchant_counts.get(order.merchant_name, 0) + 1
            total_amount += order.total_amount
        
        # 按订单次数排序
        top_merchants = sorted(merchant_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "top_cuisines": [m[0] for m in top_merchants],
            "avg_amount": total_amount / len(orders) if orders else 0
        }
    
    def _infer_price_sensitivity(self, orders: List[OrderInfo]) -> str:
        """从订单金额推断价格敏感度"""
        if not orders:
            return "中等"
        
        avg_amount = sum(o.total_amount for o in orders) / len(orders)
        
        if avg_amount < 25:
            return "高"  # 对价格敏感
        elif avg_amount < 50:
            return "中等"
        else:
            return "低"  # 对价格不敏感


# 全局实例
profile_service_client = ProfileServiceClient()
profile_service_adapter = ProfileServiceAdapter(profile_service_client)


async def get_real_user_profile(user_id: str, token: str = None) -> Optional[Dict[str, Any]]:
    """
    便捷函数：获取真实用户画像
    
    Args:
        user_id: 用户ID
        token: JWT Token（可选，如果之前已设置则不需要）
        
    Returns:
        用户画像字典
    """
    if token:
        profile_service_adapter.set_token(user_id, token)
    
    return await profile_service_adapter.get_user_profile(user_id)
