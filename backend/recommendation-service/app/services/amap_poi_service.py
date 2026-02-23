"""
高德POI搜索API集成服务
实现基于高德地图API的真实餐厅数据获取
"""

import requests
import asyncio
import aiohttp
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
import json

# 配置日志
logger = logging.getLogger(__name__)

@dataclass
class POIRestaurant:
    """POI餐厅信息"""
    id: str
    name: str
    location: str  # 经纬度
    address: str
    type: str  # POI类型
    typecode: str  # POI类型码
    province: str  # 省份
    city: str  # 城市
    district: str  # 区县
    tel: str  # 电话
    distance: float  # 距离（公里）
    business_area: str  # 商圈
    rating: float  # 评分
    cost: str  # 人均消费
    photos: List[Dict[str, str]]  # 图片
    opening_hours: str  # 营业时间
    tags: List[str]  # 特色标签
    
    # 计算字段
    estimated_delivery_time: int = 30  # 预估配送时间
    cuisine_type: str = "中餐"  # 菜系类型
    avg_price: float = 50.0  # 平均价格
    is_hot_food: bool = True
    is_cold_food: bool = False
    spice_level: str = "无"

class AmapPOIService:
    """高德POI搜索服务"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("MAP_API_KEY")
        if not self.api_key:
            raise ValueError("缺少高德地图API密钥，请设置MAP_API_KEY环境变量")
        
        self.base_urls = {
            "text_search": "https://restapi.amap.com/v5/place/text",
            "around_search": "https://restapi.amap.com/v5/place/around", 
            "polygon_search": "https://restapi.amap.com/v5/place/polygon",
            "detail_search": "https://restapi.amap.com/v5/place/detail"
        }
        
        # POI类型码映射
        self.cuisine_type_mapping = {
            "050100": "中餐厅",
            "050101": "川菜",
            "050102": "粤菜",
            "050103": "鲁菜",
            "050104": "苏菜",
            "050105": "浙菜",
            "050106": "湘菜",
            "050107": "徽菜",
            "050108": "闽菜",
            "050109": "京菜",
            "050110": "鄂菜",
            "050111": "东北菜",
            "050112": "云南菜",
            "050113": "贵州菜",
            "050114": "晋菜",
            "050115": "蒙古菜",
            "050116": "新疆菜",
            "050117": "西藏菜",
            "050118": "火锅店",
            "050119": "汤锅店",
            "050200": "外国餐厅",
            "050201": "韩国料理",
            "050202": "日本料理",
            "050203": "泰国菜",
            "050204": "印度菜",
            "050205": "法国菜",
            "050206": "意大利菜",
            "050207": "美国菜",
            "050300": "快餐厅",
            "050301": "肯德基",
            "050302": "麦当劳",
            "050400": "茶艺馆",
            "050500": "冷饮店",
            "050600": "咖啡厅"
        }
        
        # 菜系特征映射
        self.cuisine_features = {
            "川菜": {"spice_level": "重辣", "features": ["下饭", "开胃", "解腻"]},
            "粤菜": {"spice_level": "无", "features": ["清淡", "精致", "养生"]},
            "火锅店": {"spice_level": "中辣", "features": ["暖胃", "滋补", "聚餐"]},
            "汤锅店": {"spice_level": "微辣", "features": ["暖胃", "滋补", "养生"]},
            "韩国料理": {"spice_level": "中辣", "features": ["下饭", "特色"]},
            "日本料理": {"spice_level": "无", "features": ["清淡", "精致", "健康"]},
            "快餐厅": {"spice_level": "无", "features": ["快捷", "经典", "下饭"]},
            "冷饮店": {"spice_level": "无", "features": ["清爽", "冰品", "解腻"]},
            "咖啡厅": {"spice_level": "无", "features": ["轻食", "休闲", "精致"]}
        }
    
    async def search_restaurants_by_keywords(
        self, 
        keywords: str, 
        region: str = "北京市",
        page_size: int = 20,
        city_limit: bool = True,
        show_fields: str = "business,navi,photos"
    ) -> List[POIRestaurant]:
        """关键字搜索餐厅"""
        
        params = {
            "keywords": keywords,
            "region": region, 
            "city_limit": "true" if city_limit else "false",
            "show_fields": show_fields,
            "page_size": min(page_size, 25),  # API限制最大25
            "key": self.api_key
        }
        
        return await self._make_poi_request("text_search", params)
    
    async def search_restaurants_by_types(
        self,
        types: str,  # 类型码，用|分隔
        region: str = "北京市",
        page_size: int = 20,
        city_limit: bool = True,
        show_fields: str = "business,navi,photos"
    ) -> List[POIRestaurant]:
        """按类型搜索餐厅"""
        
        params = {
            "types": types,
            "region": region,
            "city_limit": "true" if city_limit else "false", 
            "show_fields": show_fields,
            "page_size": min(page_size, 25),
            "key": self.api_key
        }
        
        return await self._make_poi_request("text_search", params)
    
    async def search_restaurants_around(
        self,
        location: str,  # 经纬度 "116.473168,39.993015"
        radius: int = 5000,  # 半径，米
        keywords: str = None,
        types: str = None,
        page_size: int = 20,
        show_fields: str = "business,navi,photos"
    ) -> List[POIRestaurant]:
        """周边搜索餐厅"""
        
        params = {
            "location": location,
            "radius": min(radius, 50000),  # API限制最大50000米
            "page_size": min(page_size, 25),
            "show_fields": show_fields,
            "key": self.api_key
        }
        
        if keywords:
            params["keywords"] = keywords
            
        if types:
            params["types"] = types
        else:
            # 默认餐饮服务相关类型
            params["types"] = "050000|050100|050200|050300"
        
        return await self._make_poi_request("around_search", params)
    
    async def get_restaurant_details(
        self,
        poi_ids: List[str],  # POI ID列表，最多10个
        show_fields: str = "business,navi,photos"
    ) -> List[POIRestaurant]:
        """获取餐厅详细信息"""
        
        if len(poi_ids) > 10:
            logger.warning("POI ID数量超过10个，截取前10个")
            poi_ids = poi_ids[:10]
        
        params = {
            "id": "|".join(poi_ids),
            "show_fields": show_fields,
            "key": self.api_key
        }
        
        return await self._make_poi_request("detail_search", params)
    
    async def _make_poi_request(
        self, 
        search_type: str, 
        params: Dict[str, Any]
    ) -> List[POIRestaurant]:
        """发起POI搜索请求"""
        
        url = self.base_urls.get(search_type)
        if not url:
            raise ValueError(f"不支持的搜索类型: {search_type}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_poi_response(data)
                    else:
                        logger.error(f"POI搜索请求失败: {response.status}")
                        return []
        
        except asyncio.TimeoutError:
            logger.error("POI搜索请求超时")
            return []
        except Exception as e:
            logger.error(f"POI搜索请求异常: {e}")
            return []
    
    def _parse_poi_response(self, data: Dict[str, Any]) -> List[POIRestaurant]:
        """解析POI响应数据"""
        
        restaurants = []
        
        if data.get("status") != "1":
            logger.error(f"POI API响应错误: {data.get('info')}")
            return restaurants
        
        pois = data.get("pois", [])
        logger.info(f"POI API返回 {len(pois)} 个结果")
        
        # 调试：打印第一个POI的结构
        if pois:
            first_poi = pois[0]
            logger.info(f"首个POI字段: {list(first_poi.keys())}")
            logger.info(f"首个POI distance字段值: {first_poi.get('distance', 'NOT_FOUND')}")
        
        for poi in pois:
            try:
                restaurant = self._convert_poi_to_restaurant(poi)
                if restaurant:
                    restaurants.append(restaurant)
            except Exception as e:
                logger.error(f"解析POI数据失败: {e}, POI: {poi.get('name', 'Unknown')}")
                continue
        
        logger.info(f"成功解析 {len(restaurants)} 个餐厅POI")
        return restaurants
    
    def _convert_poi_to_restaurant(self, poi: Dict[str, Any]) -> Optional[POIRestaurant]:
        """将POI数据转换为餐厅对象"""
        
        try:
            # 基本信息
            poi_id = poi.get("id", "")
            name = poi.get("name", "")
            location = poi.get("location", "")
            address = poi.get("address", "")
            poi_type = poi.get("type", "")
            typecode = poi.get("typecode", "")
            
            # 地理信息
            province = poi.get("pname", "")
            city = poi.get("cityname", "")
            district = poi.get("adname", "")
            
            # 商业信息
            business = poi.get("business", {})
            tel = business.get("tel", "") if business else ""
            business_area = business.get("business_area", "") if business else ""
            rating_str = business.get("rating", "0") if business else "0"
            cost = business.get("cost", "") if business else ""
            opentime = business.get("opentime_today", "") if business else ""
            
            # 图片信息
            photos_data = poi.get("photos", [])
            photos = []
            if photos_data:
                for photo in photos_data:
                    photos.append({
                        "title": photo.get("title", ""),
                        "url": photo.get("url", "")
                    })
            
            # 计算距离 - 高德周边搜索API直接返回distance字段（单位：米）
            distance = 0.0
            # 周边搜索返回的distance是米，需转换为公里
            logger.debug(f"POI '{name}' 原始distance字段: {poi.get('distance')}, navi字段: {poi.get('navi')}")
            if "distance" in poi:
                try:
                    raw_distance = poi.get("distance", 0)
                    distance = float(raw_distance) / 1000.0  # 转换为公里
                    logger.debug(f"POI '{name}' 解析距离: {raw_distance}米 -> {distance}公里")
                except (ValueError, TypeError) as e:
                    logger.warning(f"POI '{name}' 解析距离失败: {e}")
                    distance = 0.0
            # 如果没有distance字段，尝试从navi中获取
            if distance <= 0:
                navi = poi.get("navi", {})
                if navi and isinstance(navi, dict):
                    try:
                        navi_distance = navi.get("distance")
                        if navi_distance:
                            distance = float(navi_distance) / 1000.0
                    except (ValueError, TypeError):
                        pass
            # 如果仍然没有距离，使用默认值
            if distance <= 0:
                distance = 2.0  # 默认2公里
            
            # 解析评分
            rating = 0.0
            try:
                if rating_str and rating_str != "":
                    rating = float(rating_str)
            except (ValueError, TypeError):
                rating = 4.0  # 默认评分
            
            # 解析价格
            avg_price = 50.0
            if cost:
                try:
                    # 提取数字
                    import re
                    price_match = re.findall(r'\d+', cost)
                    if price_match:
                        avg_price = float(price_match[0])
                except:
                    pass
            
            # 根据类型码确定菜系和特征
            cuisine_type = self.cuisine_type_mapping.get(typecode, "中餐")
            features = self.cuisine_features.get(cuisine_type, {})
            
            spice_level = features.get("spice_level", "无")
            tags = features.get("features", ["经典"])
            
            # 判断冷热食
            is_hot_food = True
            is_cold_food = False
            
            if "冷饮" in poi_type or "冰品" in poi_type or typecode == "050500":
                is_hot_food = False
                is_cold_food = True
            elif "咖啡" in poi_type or "茶" in poi_type:
                is_cold_food = True
            
            # 估算配送时间
            estimated_delivery_time = 30
            if distance <= 1.0:
                estimated_delivery_time = 20
            elif distance <= 2.0:
                estimated_delivery_time = 25
            elif distance >= 5.0:
                estimated_delivery_time = 45
            
            restaurant = POIRestaurant(
                id=poi_id,
                name=name,
                location=location,
                address=address,
                type=poi_type,
                typecode=typecode,
                province=province,
                city=city,
                district=district,
                tel=tel,
                distance=distance,
                business_area=business_area,
                rating=rating,
                cost=cost,
                photos=photos,
                opening_hours=opentime,
                tags=tags,
                estimated_delivery_time=estimated_delivery_time,
                cuisine_type=cuisine_type,
                avg_price=avg_price,
                is_hot_food=is_hot_food,
                is_cold_food=is_cold_food,
                spice_level=spice_level
            )
            
            return restaurant
            
        except Exception as e:
            logger.error(f"转换POI数据失败: {e}")
            return None
    
    async def search_restaurants_with_strategy(
        self,
        search_params: Dict[str, Any],
        user_location: str = None
    ) -> List[POIRestaurant]:
        """根据推荐策略搜索餐厅"""
        
        restaurants = []
        
        # 优先使用关键词搜索
        if "keywords" in search_params and search_params["keywords"]:
            keyword_restaurants = await self.search_restaurants_by_keywords(
                keywords=search_params["keywords"],
                region=search_params.get("region", "北京市"),
                page_size=search_params.get("page_size", 15),
                city_limit=search_params.get("city_limit", "true") == "true",
                show_fields=search_params.get("show_fields", "business,navi,photos")
            )
            restaurants.extend(keyword_restaurants)
        
        # 补充类型搜索
        if "types" in search_params and search_params["types"]:
            remaining_count = search_params.get("page_size", 20) - len(restaurants)
            if remaining_count > 0:
                type_restaurants = await self.search_restaurants_by_types(
                    types=search_params["types"],
                    region=search_params.get("region", "北京市"),
                    page_size=remaining_count,
                    city_limit=search_params.get("city_limit", "true") == "true",
                    show_fields=search_params.get("show_fields", "business,navi,photos")
                )
                restaurants.extend(type_restaurants)
        
        # 去重（基于餐厅ID）
        seen_ids = set()
        unique_restaurants = []
        for restaurant in restaurants:
            if restaurant.id not in seen_ids:
                seen_ids.add(restaurant.id)
                unique_restaurants.append(restaurant)
        
        logger.info(f"搜索到 {len(unique_restaurants)} 个餐厅，去重后返回")
        
        return unique_restaurants[:search_params.get("page_size", 20)]

    async def search_restaurants(
        self,
        location: str = None,
        latitude: float = None,
        longitude: float = None,
        keywords: str = "餐厅",
        radius: int = 5000,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """
        统一的餐厅搜索接口（支持双重召回机制，防止精准查询无结果）
        """
        restaurants = []
        seen_ids = set()

        # 内部辅助函数：执行一次获取
        async def _fetch_pois(search_kw: str, max_count: int):
            if latitude and longitude:
                location_str = f"{longitude},{latitude}"
                return await self.search_restaurants_around(
                    location=location_str, radius=radius, keywords=search_kw, page_size=min(max_count, 25))
            elif location:
                return await self.search_restaurants_by_keywords(
                    keywords=search_kw, region=location, page_size=min(max_count, 25))
            else:
                return await self.search_restaurants_by_keywords(
                    keywords=search_kw, region="上海市", page_size=min(max_count, 25))

        try:
            # 1. 第一重召回：精准意图召回
            actual_keyword = keywords if keywords and keywords.strip() else "餐厅"
            primary_results = await _fetch_pois(actual_keyword, limit)
            
            for poi in primary_results:
                if poi.id not in seen_ids:
                    seen_ids.add(poi.id)
                    restaurants.append(self._format_poi_to_dict(poi))
            
            # 2. 第二重召回：广泛兜底召回
            # 如果用户的关键词不是通用词，且第一重拉回来的数量不够，我们就用"餐厅"兜底
            if actual_keyword not in ["餐厅", "美食", "饭店"] and len(restaurants) < limit:
                fallback_results = await _fetch_pois("餐厅", limit)
                for poi in fallback_results:
                    if poi.id not in seen_ids:
                        seen_ids.add(poi.id)
                        restaurants.append(self._format_poi_to_dict(poi))
                        if len(restaurants) >= limit:
                            break
            
            logger.info(f"双重召回完成，主关键词'{actual_keyword}'，共获取 {len(restaurants)} 家餐厅")
            return restaurants[:limit]
            
        except Exception as e:
            logger.error(f"搜索餐厅失败: {e}")
            return []

    def _format_poi_to_dict(self, poi: POIRestaurant) -> Dict[str, Any]:
        """辅助方法：将 POI 对象转换为字典格式"""
        return {
            "id": poi.id, 
            "name": poi.name, 
            "cuisine_type": poi.cuisine_type,
            "rating": poi.rating, 
            "avg_price": poi.avg_price,
            "distance": int(poi.distance * 1000),  # 转换为米
            "estimated_delivery_time": poi.estimated_delivery_time,
            "address": poi.address, 
            "tel": poi.tel, 
            "location": poi.location,
            "type": poi.type, 
            "is_hot_food": poi.is_hot_food,
            "is_cold_food": poi.is_cold_food,
            "spice_level": poi.spice_level,
            "tags": poi.tags
        }