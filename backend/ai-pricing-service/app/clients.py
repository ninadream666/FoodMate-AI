import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# 服务地址配置
MERCHANT_SERVICE_URL = "http://merchant-service:8080"
ORDER_SERVICE_URL = "http://order-service:8080"

class ServiceClient:
    async def get_merchant_menu(self, merchant_id: int) -> List[Dict[str, Any]]:
        """
        调用 Merchant Service 获取当前菜单和最新价格
        解决 '价格失忆' 和 '冷启动' 问题
        """
        try:
            async with httpx.AsyncClient() as client:
                url = f"{MERCHANT_SERVICE_URL}/merchants/internal/{merchant_id}/menu-items"
                # 设置超时，防止卡死
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.warning(f"Failed to fetch menu for merchant {merchant_id}: {resp.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error connecting to Merchant Service: {e}")
            return []

    async def get_sales_stats(self, merchant_id: int, days: int = 30) -> Dict[int, Dict]:
        """
        调用Order Service获取真实销量统计
        返回格式: {menu_item_id: {quantity: 100, totalRevenue: 5000}}
        """
        try:
            async with httpx.AsyncClient() as client:
                url = f"{ORDER_SERVICE_URL}/orders/internal/stats/sales"
                params = {"merchantId": merchant_id, "days": days}
                resp = await client.get(url, params=params, timeout=5.0)
                
                if resp.status_code == 200:
                    data = resp.json()
                    # 转换为字典以便快速查找: {item_id: stats_obj}
                    stats_map = {}
                    for item in data:
                        # 确保menuItemId存在
                        if 'menuItemId' in item:
                            stats_map[item['menuItemId']] = item
                    return stats_map
                else:
                    logger.warning(f"Failed to fetch stats for merchant {merchant_id}: {resp.status_code}")
                    return {}
        except Exception as e:
            logger.error(f"Error connecting to Order Service: {e}")
            return {}

    async def get_active_merchants(self) -> List[Dict[str, Any]]:
        """
        调用Merchant Service获取所有开启动态定价的商家
        """
        try:
            async with httpx.AsyncClient() as client:
                url = f"{MERCHANT_SERVICE_URL}/merchants/internal/active"
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.warning(f"Failed to fetch active merchants: {resp.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error connecting to Merchant Service: {e}")
            return []

service_client = ServiceClient()