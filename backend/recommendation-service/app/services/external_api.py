"""
外部API集成服务
包括天气API、地图API、时间节气API等
"""

import requests
import asyncio
import aiohttp
import time
import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from .jwt_service import QWeatherJWTService
from .api_monitor import api_monitor, APIStatus

# 配置日志
logger = logging.getLogger(__name__)

@dataclass
class WeatherInfo:
    """天气信息"""
    temperature: float
    condition: str  # 天气状况：晴天、雨天、阴天等
    humidity: float
    wind_speed: float
    feels_like: float

@dataclass
class TrafficInfo:
    """交通信息"""
    congestion_level: str  # 拥堵程度：轻微、中度、严重
    travel_time_multiplier: float  # 相对正常时间的倍数
    recommended_transport: str  # 推荐交通方式

@dataclass
class TrafficStatusInfo:
    """交通态势详细信息"""
    status: int  # 路况：0未知，1畅通，2缓行，3拥堵
    description: str  # 路况综述
    expedite: float  # 畅通所占百分比
    congested: float  # 缓行所占百分比
    blocked: float  # 拥堵所占百分比
    unknown: float  # 未知路段所占百分比
    roads: List[Dict[str, Any]]  # 道路详细信息列表

@dataclass 
class RoadTrafficInfo:
    """单条道路交通信息"""
    name: str  # 道路名称
    status: int  # 路况：0未知，1畅通，2缓行，3拥堵
    direction: str  # 方向描述
    angle: int  # 车行角度
    speed: int  # 平均速度 km/h
    polyline: str  # 道路坐标集

@dataclass
class LocationInfo:
    """地点信息"""
    latitude: float
    longitude: float
    address: str
    district: str  # 区域
    nearby_landmarks: List[str]  # 附近地标

@dataclass
class CalendarInfo:
    """日历信息"""
    date: str
    year: int
    month: int
    day: int
    weekday: str
    lunar_date: str
    is_holiday: bool
    holiday_name: str
    is_work_day: bool
    solar_term: str
    suit: str  # 宜
    avoid: str  # 忌
    desc: str  # 描述

class WeatherAPIService:
    """和风天气API服务，支持JWT认证"""
    
    def __init__(self, api_key: str = None, api_host: str = None, use_jwt: bool = None):
        # 和风天气API配置
        self.api_host = api_host or os.getenv("QWEATHER_API_HOST", "api.qweather.com")  # 使用正式API地址
        self.base_url = f"https://{self.api_host}/v7/weather/now"
        
        # 判断是否使用JWT认证，默认启用
        self.use_jwt = use_jwt if use_jwt is not None else os.getenv("QWEATHER_USE_JWT", "true").lower() == "true"
        
        if self.use_jwt:
            # 使用JWT认证
            self.jwt_service = QWeatherJWTService.from_env()
            # 验证JWT配置
            jwt_status = self.jwt_service.verify_configuration()
            if not jwt_status["can_generate_token"]:
                logger.warning(f"JWT配置不完整，将使用API Key认证")
                print(f"JWT配置状态: {jwt_status}")
                self.jwt_service = None
                self.use_jwt = False
                # 降级使用API Key认证
                self.api_key = api_key or os.getenv("QWEATHER_API_KEY", "demo_api_key_please_replace")
            else:
                self.api_key = None
        else:
            # 使用传统API Key认证
            self.api_key = api_key or os.getenv("QWEATHER_API_KEY", "demo_api_key_please_replace")
            self.jwt_service = None
            
        # 检查API密钥配置并发出警告，但不阻止服务运行
        if self.use_jwt:
            if not self.jwt_service:
                logger.warning("和风天气JWT认证配置失败，将使用智能降级数据")
                print("⚠️  和风天气JWT认证未正确配置，天气服务将使用智能降级数据")
        elif not self.use_jwt and (not self.api_key or self.api_key == "demo_api_key_please_replace"):
            logger.warning("和风天气API密钥未正确配置，将使用模拟天气数据")
            print("⚠️  和风天气API密钥未配置或使用默认值，天气服务将使用智能降级数据")
    
    async def get_weather(self, latitude: float, longitude: float) -> Optional[WeatherInfo]:
        """获取指定位置的天气信息 - 和风天气API"""
        start_time = time.time()
        try:
            # 和风天气API使用经纬度格式：longitude,latitude
            location = f"{longitude:.2f},{latitude:.2f}"
            
            params = {
                "location": location,
                "lang": "zh",  # 中文
                "unit": "m"    # 公制单位
            }
            
            # 根据认证方式设置请求头
            headers = {}
            
            if self.use_jwt and self.jwt_service:
                # 使用JWT认证
                jwt_token = self.jwt_service.generate_jwt_token()
                if jwt_token:
                    headers["Authorization"] = f"Bearer {jwt_token}"
                else:
                    print("JWT token生成失败，尝试使用API Key认证")
                    if self.api_key:
                        params["key"] = self.api_key
            else:
                # 使用传统API Key认证
                if self.api_key:
                    params["key"] = self.api_key
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # 检查API返回状态
                        if data.get("code") == "200" and "now" in data:
                            now_data = data["now"]
                            return WeatherInfo(
                                temperature=float(now_data["temp"]),
                                condition=now_data["text"],  # 天气现象文字
                                humidity=float(now_data["humidity"]),
                                wind_speed=float(now_data["windSpeed"]) / 3.6,  # 转换为m/s
                                feels_like=float(now_data["feelsLike"])
                            )
                        else:
                            print(f"和风天气API返回错误: {data.get('code', 'unknown')}")
                    elif response.status == 403:
                        response_time = time.time() - start_time
                        error_text = await response.text()
                        error_msg = f"HTTP {response.status} - 权限不足，请检查API密钥和配置"
                        print(f"和风天气API请求失败: {error_msg}")
                        logger.warning(f"Weather API 403 error, using fallback data: {error_text[:200]}")
                        
                        # 记录API调用失败
                        api_monitor.record_api_call(
                            service_name="qweather",
                            endpoint="weather/now",
                            status=APIStatus.FAILED,
                            response_time=response_time,
                            http_status=403,
                            error_message=error_msg
                        )
                    else:
                        response_time = time.time() - start_time
                        error_msg = f"HTTP {response.status}"
                        print(f"和风天气API请求失败: {error_msg}")
                        
                        # 记录API调用失败
                        api_monitor.record_api_call(
                            service_name="qweather",
                            endpoint="weather/now",
                            status=APIStatus.FAILED,
                            response_time=response_time,
                            http_status=response.status,
                            error_message=error_msg
                        )
                        
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = str(e)
            print(f"获取天气信息失败: {error_msg}")
            
            # 记录API调用异常
            api_monitor.record_api_call(
                service_name="qweather",
                endpoint="weather/now",
                status=APIStatus.FAILED,
                response_time=response_time,
                error_message=error_msg
            )
        
        # 当API调用失败时，返回智能默认天气信息
        return self._get_fallback_weather_info()
    
    def _get_fallback_weather_info(self) -> WeatherInfo:
        """获取降级天气信息（基于时间和季节的智能估算）"""
        from datetime import datetime
        
        now = datetime.now()
        month = now.month
        hour = now.hour
        
        # 基于季节估算温度
        if month in [12, 1, 2]:  # 冬季
            base_temp = 8.0
            condition = "阴天"
        elif month in [3, 4, 5]:  # 春季
            base_temp = 18.0
            condition = "多云"
        elif month in [6, 7, 8]:  # 夏季
            base_temp = 28.0
            condition = "晴天"
        else:  # 秋季 [9, 10, 11]
            base_temp = 20.0
            condition = "晴转多云"
        
        # 基于时间调整温度
        if 6 <= hour <= 18:  # 白天
            temp_adjustment = 5.0
        else:  # 夜晚
            temp_adjustment = -3.0
            
        temperature = base_temp + temp_adjustment
        
        logger.info(f"使用降级天气信息: {temperature}°C {condition}")
        
        return WeatherInfo(
            temperature=temperature,
            condition=condition,
            humidity=65.0,
            wind_speed=3.0,
            feels_like=temperature + 2.0
        )

class MapAPIService:
    """地图API服务（高德地图）"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("MAP_API_KEY", "d93be6b2a94f35443978f16117ad1add")
        self.geocoding_url = "https://restapi.amap.com/v3/geocode/geo"
        # 交通态势查询API URL
        self.traffic_road_url = "https://restapi.amap.com/v3/traffic/status/road"
        self.traffic_circle_url = "https://restapi.amap.com/v3/traffic/status/circle"
        self.traffic_rectangle_url = "https://restapi.amap.com/v3/traffic/status/rectangle"
    
    async def get_location_info(self, address: str) -> Optional[LocationInfo]:
        """根据地址获取位置信息"""
        start_time = time.time()
        try:
            params = {
                "key": self.api_key,
                "address": address,
                "output": "JSON"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.geocoding_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data["geocodes"]:
                            geocode = data["geocodes"][0]
                            location = geocode["location"].split(",")
                            return LocationInfo(
                                latitude=float(location[1]),
                                longitude=float(location[0]),
                                address=geocode["formatted_address"],
                                district=geocode["district"],
                                nearby_landmarks=[]  # 可以进一步扩展获取附近地标
                            )
        except Exception as e:
            print(f"获取位置信息失败: {e}")
        return None
    
    async def get_traffic_info(self, latitude: float, longitude: float) -> Optional[TrafficInfo]:
        """获取指定位置的交通信息（简化版）"""
        try:
            print(f"正在查询交通信息: 经度={longitude}, 纬度={latitude}")
            # 使用圆形区域查询交通态势
            traffic_status = await self.get_traffic_status_circle(
                longitude=longitude, 
                latitude=latitude, 
                radius=1000, 
                level=6
            )
            
            if traffic_status:
                # 根据交通态势转换为简化信息
                congestion_level = self._convert_status_to_level(traffic_status.status)
                multiplier = self._get_time_multiplier(traffic_status.status)
                transport = self._get_recommended_transport(traffic_status.status)
                
                print(f"交通API调用成功: {congestion_level}")
                return TrafficInfo(
                    congestion_level=congestion_level,
                    travel_time_multiplier=multiplier,
                    recommended_transport=transport
                )
            else:
                # 如果API调用失败，使用时间模拟
                print("交通API调用失败，使用时间模拟数据")
                return self._get_fallback_traffic_info()
                
        except Exception as e:
            print(f"获取交通信息失败: {e}")
            return self._get_fallback_traffic_info()
            
    def _get_fallback_traffic_info(self) -> TrafficInfo:
        """获取备用交通信息（基于时间模拟）"""
        current_hour = datetime.now().hour
        
        # 基于时间段模拟交通状况
        if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
            # 上下班高峰期
            congestion_level = "拥堵"
            multiplier = 2.0
            transport = "地铁"
        elif 11 <= current_hour <= 13:
            # 午餐时间
            congestion_level = "缓行"
            multiplier = 1.3
            transport = "打车"
        else:
            congestion_level = "畅通"
            multiplier = 1.0
            transport = "步行"
            
        print(f"使用交通降级数据: {current_hour}时 -> {congestion_level}")
        
        return TrafficInfo(
            congestion_level=congestion_level,
            travel_time_multiplier=multiplier,
            recommended_transport=transport
        )
    
    async def get_traffic_status_road(self, name: str, city: str = None, adcode: str = None, level: int = 6, extensions: str = "base") -> Optional[TrafficStatusInfo]:
        """指定线路交通态势查询"""
        try:
            params = {
                "key": self.api_key,
                "name": name,
                "level": level,
                "output": "JSON",
                "extensions": extensions
            }
            
            # 城市参数（建议优先使用adcode）
            if adcode:
                params["adcode"] = adcode
            elif city:
                params["city"] = city
            else:
                print("警告：未提供城市信息，可能影响查询结果")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.traffic_road_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_traffic_response(data)
                    else:
                        print(f"高德交通态势API请求失败: HTTP {response.status}")
        except Exception as e:
            print(f"查询线路交通态势失败: {e}")
        return None
    
    async def get_traffic_status_circle(self, longitude: float, latitude: float, radius: int = 1000, level: int = 6, extensions: str = "base") -> Optional[TrafficStatusInfo]:
        """圆形区域内交通态势查询"""
        try:
            params = {
                "key": self.api_key,
                "location": f"{longitude:.6f},{latitude:.6f}",
                "radius": min(radius, 4999),  # 最大值4999米
                "level": level,
                "output": "JSON",
                "extensions": extensions
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.traffic_circle_url, params=params) as response:
                    # 验证API调用是否成功
                    validation_result = self._validate_api_response(response.status, await response.text() if response.status == 200 else None)
                    
                    if response.status == 200:
                        data = await response.json()
                        if validation_result["api_success"]:
                            return self._parse_traffic_response(data)
                        else:
                            print(f"高德交通态势API返回错误: {validation_result['error_message']}")
                    else:
                        print(f"高德交通态势API请求失败: HTTP {response.status} - {validation_result['error_message']}")
        except Exception as e:
            print(f"查询圆形区域交通态势失败: {e}")
        return None
    
    async def get_traffic_status_rectangle(self, southwest_lng: float, southwest_lat: float, 
                                         northeast_lng: float, northeast_lat: float, 
                                         level: int = 6, extensions: str = "base") -> Optional[TrafficStatusInfo]:
        """矩形区域内交通态势查询"""
        try:
            # 检查矩形对角线距离，不能超过10公里
            from math import radians, cos, sin, asin, sqrt
            
            def haversine(lon1, lat1, lon2, lat2):
                lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                return 2 * asin(sqrt(a)) * 6371  # 6371是地球半径（公里）
            
            distance = haversine(southwest_lng, southwest_lat, northeast_lng, northeast_lat)
            if distance > 10:
                print(f"警告：矩形对角线距离{distance:.2f}公里，超过10公里限制")
            
            params = {
                "key": self.api_key,
                "rectangle": f"{southwest_lng:.6f},{southwest_lat:.6f};{northeast_lng:.6f},{northeast_lat:.6f}",
                "level": level,
                "output": "JSON",
                "extensions": extensions
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.traffic_rectangle_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_traffic_response(data)
                    else:
                        print(f"高德交通态势API请求失败: HTTP {response.status}")
        except Exception as e:
            print(f"查询矩形区域交通态势失败: {e}")
        return None
    
    def _parse_traffic_response(self, data: Dict[str, Any]) -> Optional[TrafficStatusInfo]:
        """解析交通态势API响应"""
        try:
            # 检查API返回状态
            if data.get("status") != "1":
                print(f"高德API返回错误: {data.get('info', 'unknown')} (infocode: {data.get('infocode')})")
                return None
            
            traffic_info = data.get("trafficinfo")
            if not traffic_info:
                print("响应中未找到交通态势信息")
                return None
            
            # 解析基本交通态势信息
            evaluation = traffic_info.get("evaluation", {})
            roads_data = traffic_info.get("roads", [])
            
            # 解析道路详细信息（如果有）
            roads = []
            for road_data in roads_data:
                road_info = {
                    "name": road_data.get("name", ""),
                    "status": int(road_data.get("status", 0)),
                    "direction": road_data.get("direction", ""),
                    "angle": int(road_data.get("angle", 0)),
                    "speed": int(road_data.get("speed", 0)),
                    "polyline": road_data.get("polyline", "")
                }
                roads.append(road_info)
            
            # 解析百分比数据，处理字符串格式，如 "80.77%"
            def parse_percentage(value, default=0.0):
                try:
                    if isinstance(value, str):
                        # 去掉百分号并转换为浮点数
                        return float(value.rstrip('%'))
                    return float(value) if value else default
                except (ValueError, TypeError):
                    return default
            
            # 根据高德API文档，解析evaluation中的status字段（整体路况状态）
            overall_status = int(evaluation.get("status", 1))  # 默认畅通
            
            return TrafficStatusInfo(
                status=overall_status,  # 使用evaluation中的整体状态
                description=traffic_info.get("description", ""),
                expedite=parse_percentage(evaluation.get("expedite", 0)),
                congested=parse_percentage(evaluation.get("congested", 0)),
                blocked=parse_percentage(evaluation.get("blocked", 0)),
                unknown=parse_percentage(evaluation.get("unknown", 0)),
                roads=roads
            )
            
        except Exception as e:
            print(f"解析交通态势响应失败: {e}")
        return None
    
    def _convert_status_to_level(self, status: int) -> str:
        """转换状态码为拥堵程度描述（高德API：1=畅通,2=缓行,3=拥堵,4=严重拥堵）"""
        status_map = {
            1: "畅通",    # 畅通
            2: "缓行",    # 缓行 
            3: "拥堵",    # 拥堵
            4: "严重拥堵" # 严重拥堵
        }
        result = status_map.get(status, "未知")
        print(f"交通状态转换: {status} -> {result}")
        return result
    
    def _get_time_multiplier(self, status: int) -> float:
        """根据交通状态获取时间倍数"""
        multiplier_map = {
            1: 1.0,   # 畅通
            2: 1.3,   # 缓行
            3: 1.8,   # 拥堵
            4: 2.5    # 严重拥堵
        }
        return multiplier_map.get(status, 1.0)
    
    def _get_recommended_transport(self, status: int) -> str:
        """根据交通状态推荐交通方式"""
        transport_map = {
            1: "步行",     # 畅通
            2: "打车",     # 缓行
            3: "地铁",     # 拥堵  
            4: "公交"      # 严重拥堵
        }
        return transport_map.get(status, "步行")
    
    async def get_multiple_roads_traffic(self, road_queries: List[Dict[str, str]]) -> List[Optional[TrafficStatusInfo]]:
        """批量查询多条道路的交通态势信息"""
        tasks = []
        for query in road_queries:
            task = self.get_traffic_status_road(
                name=query.get("name", ""),
                city=query.get("city"),
                adcode=query.get("adcode"),
                level=query.get("level", 6),
                extensions=query.get("extensions", "base")
            )
            tasks.append(task)
        
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    # 高德地图支持的交通态势查询城市
    SUPPORTED_CITIES = {
        "杭州": "330100", "西宁": "630100", "南京": "320100", "昆明": "530100", 
        "武汉": "420100", "上海": "310100", "珠海": "440400", "沈阳": "210100",
        "深圳": "440300", "大连": "210200", "宁波": "330200", "西安": "610100",
        "青岛": "370200", "佛山": "440600", "厦门": "350200", "福州": "350100",
        "合肥": "340100", "长沙": "430100", "温州": "330300", "台州": "331000",
        "常州": "320400", "天津": "120100", "东莞": "441900", "成都": "510100",
        "苏州": "320500", "石家庄": "130100", "长春": "220100", "太原": "140100",
        "济南": "370100", "乌鲁木齐": "650100", "绍兴": "330600", "重庆": "500100",
        "泉州": "350500", "惠州": "441300", "中山": "442000", "无锡": "320200",
        "广州": "440100", "嘉兴": "330400", "北京": "110100", "金华": "330700"
    }
    
    def is_city_supported(self, city_name: str) -> bool:
        """检查城市是否支持交通态势查询"""
        return city_name in self.SUPPORTED_CITIES
    
    def get_city_adcode(self, city_name: str) -> Optional[str]:
        """获取城市的adcode"""
        return self.SUPPORTED_CITIES.get(city_name)
    
    def _validate_api_response(self, status_code: int, response_text: str = None) -> Dict[str, Any]:
        """
        验证API响应是否成功
        
        Args:
            status_code: HTTP状态码
            response_text: 响应文本（JSON字符串）
            
        Returns:
            验证结果字典，包含success、api_success、error_message等信息
        """
        result = {
            "http_success": False,
            "api_success": False,
            "error_message": "",
            "error_code": None,
            "validation_details": {}
        }
        
        # HTTP状态码验证
        if status_code == 200:
            result["http_success"] = True
        else:
            result["error_message"] = f"HTTP请求失败，状态码: {status_code}"
            return result
        
        # API响应验证
        if response_text:
            try:
                import json
                data = json.loads(response_text)
                
                # 检查API状态
                api_status = data.get("status")
                if api_status == "1":
                    result["api_success"] = True
                    result["validation_details"]["traffic_info"] = data.get("trafficinfo", {})
                else:
                    result["error_message"] = f"API返回错误: {data.get('info', '未知错误')}"
                    result["error_code"] = data.get("infocode")
                    
                    # 提供具体的错误解释
                    error_explanations = {
                        "10001": "API Key无效或不存在",
                        "10002": "请求过于频繁，请稍后再试",
                        "10003": "访问已超出日配额",
                        "10004": "用户访问过于频繁",
                        "10005": "用户没有权限访问交通态势服务",
                        "20001": "请求参数非法",
                        "20002": "缺少必填参数",
                        "20011": "查询坐标在海外，但没有海外地图权限"
                    }
                    
                    if result["error_code"] in error_explanations:
                        result["error_message"] += f" ({error_explanations[result['error_code']]})"
                
            except json.JSONDecodeError:
                result["error_message"] = "API返回的数据格式不正确"
        
        return result
    
    async def validate_traffic_api_connection(self, test_location: str = "116.397428,39.90923") -> Dict[str, Any]:
        """
        验证交通API连接是否正常
        
        Args:
            test_location: 测试位置坐标 "经度,纬度"
            
        Returns:
            验证结果字典
        """
        validation_result = {
            "connection_success": False,
            "api_accessible": False,
            "has_permission": False,
            "response_time_ms": 0,
            "error_details": [],
            "test_location": test_location,
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            import time
            start_time = time.time()
            
            # 测试API连接
            lng, lat = map(float, test_location.split(','))
            
            # 使用圆形查询测试连接
            params = {
                "key": self.api_key,
                "location": test_location,
                "radius": 1000,
                "level": 6,
                "output": "JSON"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.traffic_circle_url, params=params, timeout=10) as response:
                    end_time = time.time()
                    validation_result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
                    
                    if response.status == 200:
                        validation_result["connection_success"] = True
                        
                        response_text = await response.text()
                        api_validation = self._validate_api_response(response.status, response_text)
                        
                        if api_validation["api_success"]:
                            validation_result["api_accessible"] = True
                            validation_result["has_permission"] = True
                        else:
                            validation_result["error_details"].append(api_validation["error_message"])
                            
                            # 特殊处理权限错误
                            if api_validation["error_code"] == "10005":
                                validation_result["has_permission"] = False
                    else:
                        validation_result["error_details"].append(f"HTTP请求失败: {response.status}")
                        
        except asyncio.TimeoutError:
            validation_result["error_details"].append("请求超时")
        except Exception as e:
            validation_result["error_details"].append(f"连接异常: {str(e)}")
        
        return validation_result
    
    def print_validation_report(self, validation_result: Dict[str, Any]):
        """打印验证报告"""
        print("🚗 交通API连接验证报告")
        print("=" * 40)
        
        if validation_result["connection_success"]:
            print("✅ HTTP连接成功")
        else:
            print("❌ HTTP连接失败")
        
        if validation_result["api_accessible"]:
            print("✅ API服务可访问")
        else:
            print("❌ API服务不可访问")
        
        if validation_result["has_permission"]:
            print("✅ 交通态势服务权限正常")
        else:
            print("❌ 缺少交通态势服务权限")
        
        print(f"🕐 响应时间: {validation_result['response_time_ms']}ms")
        print(f"📍 测试位置: {validation_result['test_location']}")
        
        if validation_result["error_details"]:
            print("❌ 错误详情:")
            for error in validation_result["error_details"]:
                print(f"   - {error}")
        
        print()
        
        # 提供建议
        if not validation_result["connection_success"]:
            print("💡 连接问题解决建议:")
            print("   1. 检查网络连接")
            print("   2. 检查防火墙设置")
            print("   3. 验证API服务器地址是否正确")
        elif not validation_result["api_accessible"]:
            print("💡 API访问问题解决建议:")
            print("   1. 检查API Key是否正确")
            print("   2. 验证API Key是否已激活")
            print("   3. 检查请求参数格式")
        elif not validation_result["has_permission"]:
            print("💡 权限问题解决建议:")
            print("   1. 申请交通态势查询服务权限")
            print("   2. 升级到高级版API服务")
            print("   3. 联系高德地图客服")
        else:
            print("🎉 所有验证通过！交通API可以正常使用。")
        
        print("=" * 40)

class CalendarAPIService:
    """聚合数据日历API服务"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('JUHE_CALENDAR_API_KEY', 'c0b5548aeef5ca8208fef30f417c1b3d')
        self.base_url = 'http://apis.juhe.cn/fapig/calendar/day'
    
    def _format_date_for_api(self, date_str: str) -> str:
        """将日期格式转换为API要求的格式（YYYY-M-D格式，不补零）
        
        Args:
            date_str: 输入日期，支持多种格式
            
        Returns:
            YYYY-M-D 格式的日期字符串（月日不补零）
        """
        try:
            # 尝试解析日期并转换为YYYY-M-D格式
            if '-' in date_str:
                parts = date_str.split('-')
                if len(parts) == 3:
                    year, month, day = parts
                    # 去掉前导零
                    month = str(int(month))
                    day = str(int(day))
                    return f"{year}-{month}-{day}"
            return date_str
        except (ValueError, IndexError):
            return date_str
    
    async def get_calendar_info(self, date: str = None) -> Optional[CalendarInfo]:
        """获取指定日期的日历信息
        
        Args:
            date: 日期，格式为YYYY-MM-DD（标准格式），默认为今天
        
        Returns:
            CalendarInfo对象或None
        """
        if date is None:
            now = datetime.now()
            date = now.strftime('%Y-%m-%d')
        else:
            # 确保日期格式正确（YYYY-MM-DD标准格式）
            date = self._format_date_for_api(date)
        
        try:
            params = {
                'key': self.api_key,
                'date': date,
                'detail': '1'  # 获取详细信息
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_calendar_response(data)
                    else:
                        print(f"日历API请求失败: HTTP {response.status}")
        except Exception as e:
            print(f"查询日历信息失败: {e}")
        return None
    
    def _parse_calendar_response(self, data: Dict[str, Any]) -> Optional[CalendarInfo]:
        """解析节假日安排查询API响应"""
        try:
            if data.get('error_code') == 0:
                result = data.get('result', {})
                
                # 解析基本信息
                date_str = result.get('date', '')
                year = int(result.get('year', 0))
                month = int(result.get('month', 0))
                day = int(result.get('day', 0))
                
                # 解析星期
                weekday = result.get('week', '')
                
                # 解析农历信息
                lunar_year = result.get('lunarYear', '')
                lunar_month = result.get('lMonth', '')
                lunar_date_str = result.get('lDate', '')
                lunar_date = f"{lunar_year}年{lunar_month}月{lunar_date_str}"
                
                # 解析节假日信息
                status_desc = result.get('statusDesc', '')  # '工作日' 或 '节假日'
                status = result.get('status')  # 1表示节假日
                holiday_name = result.get('term', '')  # 节假日名称
                is_holiday = status == '1' or '节假日' in status_desc
                
                # 判断是否为工作日
                is_work_day = '工作日' in status_desc and not is_holiday
                
                # 解析节气信息
                solar_term = ''
                # 一些传统节日可能同时包含节气信息
                if holiday_name and not is_holiday:
                    solar_term = holiday_name
                    holiday_name = ''
                
                # 解析宜忌信息
                suit = result.get('suit', '')
                avoid = result.get('avoid', '')
                
                # 生成描述
                desc = f"{weekday}"
                if is_holiday and holiday_name:
                    desc += f" {holiday_name}"
                if solar_term:
                    desc += f" {solar_term}"
                
                logger.debug(f"日历解析成功: {date_str} {weekday} 节假日:{is_holiday} 假期:{holiday_name}")
                
                return CalendarInfo(
                    date=date_str,
                    year=year,
                    month=month,
                    day=day,
                    weekday=weekday,
                    lunar_date=lunar_date,
                    is_holiday=is_holiday,
                    holiday_name=holiday_name if holiday_name else '',
                    is_work_day=is_work_day,
                    solar_term=solar_term,
                    suit=suit,
                    avoid=avoid,
                    desc=desc
                )
            else:
                error_msg = data.get('reason', '未知错误')
                logger.error(f"日历API返回错误: {error_msg}")
        except Exception as e:
            logger.error(f"解析节假日安排响应失败: {e}")
        return None
    
    def get_meal_recommendation_by_calendar(self, calendar_info: CalendarInfo) -> Dict[str, Any]:
        """根据日历信息给出餐饮推荐"""
        recommendations = {
            "time_context": {},
            "holiday_context": {},
            "seasonal_context": {},
            "cultural_context": {}
        }
        
        # 时间上下文
        recommendations["time_context"] = {
            "date": calendar_info.date,
            "weekday": calendar_info.weekday,
            "is_work_day": calendar_info.is_work_day,
            "lunar_date": calendar_info.lunar_date
        }
        
        # 节假日上下文
        if calendar_info.is_holiday:
            recommendations["holiday_context"] = {
                "is_holiday": True,
                "holiday_name": calendar_info.holiday_name,
                "suggestion": self._get_holiday_food_suggestion(calendar_info.holiday_name)
            }
        
        # 季节性上下文
        if calendar_info.solar_term:
            recommendations["seasonal_context"] = {
                "solar_term": calendar_info.solar_term,
                "suggestion": self._get_solar_term_food_suggestion(calendar_info.solar_term)
            }
        
        # 文化上下文
        recommendations["cultural_context"] = {
            "suit": calendar_info.suit,
            "avoid": calendar_info.avoid,
            "desc": calendar_info.desc
        }
        
        return recommendations
    
    def _get_holiday_food_suggestion(self, holiday_name: str) -> str:
        """根据节假日推荐餐饮"""
        holiday_foods = {
            "春节": "饺子、年糕、鱼类菜肴，寓意年年有余",
            "元宵节": "汤圆、元宵，象征团团圆圆",
            "清明节": "青团、春饼，清淡时令菜品",
            "端午节": "粽子、咸鸭蛋，传统节日美食",
            "中秋节": "月饼、桂花糕，团圆佳品",
            "国庆节": "家常菜、聚餐套餐，庆祝美食",
            "情人节": "浪漫西餐、甜品，营造浪漫氛围",
            "母亲节": "温馨家常菜、养生汤品",
            "父亲节": "烧烤、啤酒、男士喜爱美食"
        }
        return holiday_foods.get(holiday_name, "节日特色美食，增添节日氛围")
    
    def _get_solar_term_food_suggestion(self, solar_term: str) -> str:
        """根据节气推荐餐饮"""
        solar_term_foods = {
            "立春": "春饼、韭菜，顺应春气升发",
            "雨水": "粥类、汤品，滋养脾胃",
            "惊蛰": "梨子、清淡菜品，清热润燥",
            "春分": "时令蔬菜、平和食材",
            "清明": "青团、春茶，清淡养生",
            "谷雨": "茶叶、祛湿食材",
            "立夏": "清热解毒、苦味菜品",
            "小满": "清淡饮食、去湿食材",
            "芒种": "清热利湿、时令水果",
            "夏至": "消暑降温、冷饮凉菜",
            "小暑": "绿豆汤、清热食品",
            "大暑": "消暑解热、清淡饮食",
            "立秋": "滋阴润燥、秋季进补",
            "处暑": "润燥养肺、梨类水果",
            "白露": "温润食材、养阴清燥",
            "秋分": "平补食材、温性食品",
            "寒露": "温补肾阳、羊肉等",
            "霜降": "温补脾胃、栗子等",
            "立冬": "温补肾阳、进补食材",
            "小雪": "温热食品、火锅类",
            "大雪": "温补食材、热饮热食",
            "冬至": "饺子、汤圆、温补食品",
            "小寒": "温热进补、羊肉火锅",
            "大寒": "温补肾阳、热性食材"
        }
        return solar_term_foods.get(solar_term, "根据节气特点，选择应季食材")

class TimeAPIService:
    """时间和节气API服务"""
    
    def __init__(self):
        # 节气数据（简化版本）
        self.solar_terms = {
            "春分": {"start": "03-20", "end": "04-04", "season": "春"},
            "清明": {"start": "04-04", "end": "04-20", "season": "春"},
            "谷雨": {"start": "04-20", "end": "05-05", "season": "春"},
            "立夏": {"start": "05-05", "end": "05-21", "season": "夏"},
            "小满": {"start": "05-21", "end": "06-05", "season": "夏"},
            "芒种": {"start": "06-05", "end": "06-21", "season": "夏"},
            "夏至": {"start": "06-21", "end": "07-07", "season": "夏"},
            "小暑": {"start": "07-07", "end": "07-23", "season": "夏"},
            "大暑": {"start": "07-23", "end": "08-07", "season": "夏"},
            "立秋": {"start": "08-07", "end": "08-23", "season": "秋"},
            "处暑": {"start": "08-23", "end": "09-07", "season": "秋"},
            "白露": {"start": "09-07", "end": "09-23", "season": "秋"},
            "秋分": {"start": "09-23", "end": "10-08", "season": "秋"},
            "寒露": {"start": "10-08", "end": "10-23", "season": "秋"},
            "霜降": {"start": "10-23", "end": "11-07", "season": "秋"},
            "立冬": {"start": "11-07", "end": "11-22", "season": "冬"},
            "小雪": {"start": "11-22", "end": "12-07", "season": "冬"},
            "大雪": {"start": "12-07", "end": "12-22", "season": "冬"},
            "冬至": {"start": "12-22", "end": "01-05", "season": "冬"},
            "小寒": {"start": "01-05", "end": "01-20", "season": "冬"},
            "大寒": {"start": "01-20", "end": "02-04", "season": "冬"},
            "立春": {"start": "02-04", "end": "02-19", "season": "春"},
            "雨水": {"start": "02-19", "end": "03-05", "season": "春"},
            "惊蛰": {"start": "03-05", "end": "03-20", "season": "春"}
        }
    
    def get_current_time_info(self) -> Dict[str, Any]:
        """获取当前时间信息"""
        now = datetime.now()
        current_date = now.strftime("%m-%d")
        
        # 判断当前节气
        current_term = None
        current_season = None
        
        for term, info in self.solar_terms.items():
            start_date = datetime.strptime(f"2024-{info['start']}", "%Y-%m-%d").strftime("%m-%d")
            end_date = datetime.strptime(f"2024-{info['end']}", "%Y-%m-%d").strftime("%m-%d")
            
            # 处理跨年的情况
            if start_date <= end_date:
                if start_date <= current_date <= end_date:
                    current_term = term
                    current_season = info["season"]
                    break
            else:  # 跨年情况
                if current_date >= start_date or current_date <= end_date:
                    current_term = term
                    current_season = info["season"]
                    break
        
        return {
            "current_time": now.isoformat(),
            "date": now.strftime("%Y-%m-%d"),
            "weekday": now.strftime("%A"),
            "hour": now.hour,
            "solar_term": current_term or "未知",
            "season": current_season or "未知",
            "is_weekend": now.weekday() >= 5,
            "meal_time": self._get_meal_time(now.hour)
        }
    
    def _get_meal_time(self, hour: int) -> str:
        """根据时间判断用餐时间"""
        if 6 <= hour <= 10:
            return "早餐"
        elif 11 <= hour <= 14:
            return "午餐"
        elif 17 <= hour <= 21:
            return "晚餐"
        else:
            return "夜宵"

class ExternalAPIService:
    """外部API集成服务的主入口"""
    
    def __init__(self, weather_api_key: str = None, weather_api_host: str = None, map_api_key: str = None, use_jwt: bool = None, calendar_api_key: str = None):
        self.weather_service = WeatherAPIService(weather_api_key, weather_api_host, use_jwt)
        self.map_service = MapAPIService(map_api_key)
        self.time_service = TimeAPIService()
        self.calendar_service = CalendarAPIService(calendar_api_key)
    
    async def get_comprehensive_context(self, address: str) -> Dict[str, Any]:
        """获取综合上下文信息"""
        # 获取位置信息
        location_info = await self.map_service.get_location_info(address)
        if not location_info:
            return {"error": "无法获取位置信息"}
        
        # 并行获取天气和交通信息
        weather_task = self.weather_service.get_weather(
            location_info.latitude, location_info.longitude
        )
        traffic_task = self.map_service.get_traffic_info(
            location_info.latitude, location_info.longitude
        )
        
        weather_info, traffic_info = await asyncio.gather(weather_task, traffic_task)
        
        # 获取时间信息
        time_info = self.time_service.get_current_time_info()
        
        # 获取日历信息
        calendar_info = await self.calendar_service.get_calendar_info()
        calendar_recommendations = self.calendar_service.get_meal_recommendation_by_calendar(calendar_info) if calendar_info else {}
        
        return {
            "location": {
                "address": location_info.address,
                "district": location_info.district,
                "latitude": location_info.latitude,
                "longitude": location_info.longitude
            },
            "weather": {
                "temperature": weather_info.temperature if weather_info else 25.0,
                "condition": weather_info.condition if weather_info else "晴天",
                "humidity": weather_info.humidity if weather_info else 60.0,
                "feels_like": weather_info.feels_like if weather_info else 25.0
            },
            "traffic": {
                "congestion_level": traffic_info.congestion_level if traffic_info else "轻微",
                "travel_time_multiplier": traffic_info.travel_time_multiplier if traffic_info else 1.0,
                "recommended_transport": traffic_info.recommended_transport if traffic_info else "步行"
            },
            "time": time_info,
            "calendar": {
                "date": calendar_info.date if calendar_info else datetime.now().strftime('%Y-%m-%d'),
                "weekday": calendar_info.weekday if calendar_info else "",
                "is_holiday": calendar_info.is_holiday if calendar_info else False,
                "holiday_name": calendar_info.holiday_name if calendar_info else "",
                "recommendations": calendar_recommendations
            }
        }

class MixedSearchAPIService:
    """混合搜索API服务 - AI智能餐厅推荐"""
    
    def __init__(self):
        self.external_api = ExternalAPIService()
    
    async def intelligent_restaurant_search(self, 
                                          location: str,
                                          user_preferences: Dict[str, Any] = None,
                                          search_radius: int = 2000,
                                          max_results: int = 10) -> Dict[str, Any]:
        """
        AI智能餐厅搜索和推荐
        
        Args:
            location: 用户位置（地址）
            user_preferences: 用户偏好（可选）
                - cuisine_type: 菜系偏好 ["川菜", "粤菜", "西餐", "日料", "韩料"]
                - price_range: 价格范围 ["economic", "moderate", "high_end"]
                - dietary_restrictions: 饮食限制 ["vegetarian", "halal", "no_spicy"]
                - meal_type: 用餐类型 ["breakfast", "lunch", "dinner", "snack"]
            search_radius: 搜索半径（米）
            max_results: 最大返回结果数
        
        Returns:
            包含餐厅推荐的详细信息
        """
        try:
            # 获取综合环境信息
            logger.info(f"开始为位置 '{location}' 获取综合环境信息")
            context = await self.external_api.get_comprehensive_context(location)
            
            if "error" in context:
                return {"error": context["error"]}
            
            # 分析环境条件生成推荐策略
            recommendation_strategy = self._analyze_context_for_recommendations(
                context, user_preferences or {}
            )
            
            # 生成AI推荐餐厅列表
            recommended_restaurants = self._generate_restaurant_recommendations(
                context, recommendation_strategy, max_results
            )
            
            # 返回完整推荐结果
            return {
                "success": True,
                "location_info": context["location"],
                "environmental_context": {
                    "weather": context["weather"],
                    "traffic": context["traffic"],
                    "time_context": context["time"],
                    "calendar_context": context["calendar"]
                },
                "recommendation_strategy": recommendation_strategy,
                "recommended_restaurants": recommended_restaurants,
                "search_metadata": {
                    "search_radius": search_radius,
                    "total_results": len(recommended_restaurants),
                    "search_time": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"智能餐厅搜索失败: {e}")
            return {"error": f"搜索失败: {str(e)}"}
    
    def _analyze_context_for_recommendations(self, 
                                           context: Dict[str, Any], 
                                           user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析环境上下文生成推荐策略
        """
        strategy = {
            "primary_factors": [],
            "cuisine_suggestions": [],
            "restaurant_type_preferences": [],
            "special_considerations": []
        }
        
        # 天气影响分析
        weather = context.get("weather", {})
        temperature = weather.get("temperature", 25)
        condition = weather.get("condition", "晴天")
        
        if temperature > 30:
            strategy["primary_factors"].append("高温天气")
            strategy["cuisine_suggestions"].extend(["冷饮", "清淡菜品", "海鲜", "凉菜"])
            strategy["restaurant_type_preferences"].extend(["有空调的室内餐厅", "冷饮店", "甜品店"])
        elif temperature < 10:
            strategy["primary_factors"].append("寒冷天气")
            strategy["cuisine_suggestions"].extend(["火锅", "热汤", "烧烤", "热饮"])
            strategy["restaurant_type_preferences"].extend(["温暖的室内餐厅", "火锅店", "热饮咖啡厅"])
        
        if "雨" in condition or "雪" in condition:
            strategy["special_considerations"].append("恶劣天气，推荐近距离或有送餐服务的餐厅")
            strategy["restaurant_type_preferences"].append("支持外卖配送")
        
        # 交通情况分析
        traffic = context.get("traffic", {})
        congestion_level = traffic.get("congestion_level", "轻微")
        
        if congestion_level in ["严重", "中度"]:
            strategy["primary_factors"].append("交通拥堵")
            strategy["special_considerations"].append("交通拥堵，推荐步行可达或地铁沿线餐厅")
            strategy["restaurant_type_preferences"].extend(["步行可达", "地铁站附近"])
        
        # 时间因素分析
        time_context = context.get("time", {})
        meal_time = time_context.get("meal_time", "")
        hour = time_context.get("hour", 12)
        is_weekend = time_context.get("is_weekend", False)
        
        if meal_time == "早餐":
            strategy["cuisine_suggestions"].extend(["粥类", "包子", "豆浆", "面包", "咖啡"])
            strategy["restaurant_type_preferences"].extend(["早餐店", "咖啡厅", "便利店"])
        elif meal_time == "午餐":
            strategy["cuisine_suggestions"].extend(["快餐", "商务套餐", "家常菜"])
            strategy["restaurant_type_preferences"].extend(["快餐店", "商务餐厅", "食堂"])
        elif meal_time == "晚餐":
            if is_weekend:
                strategy["cuisine_suggestions"].extend(["精致菜品", "特色菜", "聚餐套餐"])
                strategy["restaurant_type_preferences"].extend(["特色餐厅", "聚餐场所"])
            else:
                strategy["cuisine_suggestions"].extend(["家常菜", "简餐", "外卖"])
        elif meal_time == "夜宵":
            strategy["cuisine_suggestions"].extend(["烧烤", "麻辣烫", "小食", "粥类"])
            strategy["restaurant_type_preferences"].extend(["夜宵摊", "24小时餐厅"])
        
        # 节假日和日历因素
        calendar_context = context.get("calendar", {})
        is_holiday = calendar_context.get("is_holiday", False)
        holiday_name = calendar_context.get("holiday_name", "")
        recommendations = calendar_context.get("recommendations", {})
        
        if is_holiday and holiday_name:
            strategy["primary_factors"].append(f"节假日: {holiday_name}")
            holiday_suggestions = recommendations.get("holiday_context", {}).get("suggestion", "")
            if holiday_suggestions:
                strategy["special_considerations"].append(f"节假日推荐: {holiday_suggestions}")
        
        seasonal_suggestions = recommendations.get("seasonal_context", {}).get("suggestion", "")
        if seasonal_suggestions:
            strategy["special_considerations"].append(f"节气推荐: {seasonal_suggestions}")
        
        # 用户偏好整合
        if user_preferences:
            if "cuisine_type" in user_preferences:
                strategy["cuisine_suggestions"].extend(user_preferences["cuisine_type"])
            if "price_range" in user_preferences:
                strategy["special_considerations"].append(f"价格偏好: {user_preferences['price_range']}")
            if "dietary_restrictions" in user_preferences:
                strategy["special_considerations"].extend(user_preferences["dietary_restrictions"])
        
        return strategy
    
    def _generate_restaurant_recommendations(self, 
                                          context: Dict[str, Any], 
                                          strategy: Dict[str, Any], 
                                          max_results: int) -> List[Dict[str, Any]]:
        """
        基于分析策略生成餐厅推荐（模拟数据）
        实际应用中这里会调用餐厅数据库和评分算法
        """
        location_info = context.get("location", {})
        district = location_info.get("district", "")
        
        # 模拟餐厅数据库
        sample_restaurants = [
            {
                "name": "蜀大侠火锅",
                "cuisine_type": "火锅",
                "price_range": "moderate",
                "rating": 4.5,
                "distance": 500,
                "features": ["有空调", "支持外卖", "停车方便"],
                "suitable_weather": ["寒冷", "下雨"],
                "meal_times": ["午餐", "晚餐"]
            },
            {
                "name": "星巴克咖啡",
                "cuisine_type": "咖啡",
                "price_range": "moderate",
                "rating": 4.3,
                "distance": 200,
                "features": ["有空调", "WiFi", "适合工作"],
                "suitable_weather": ["炎热", "下雨"],
                "meal_times": ["早餐", "下午茶"]
            },
            {
                "name": "外婆家",
                "cuisine_type": "江浙菜",
                "price_range": "moderate",
                "rating": 4.2,
                "distance": 800,
                "features": ["家常菜", "性价比高", "适合聚餐"],
                "suitable_weather": ["晴天", "阴天"],
                "meal_times": ["午餐", "晚餐"]
            },
            {
                "name": "麦当劳",
                "cuisine_type": "快餐",
                "price_range": "economic",
                "rating": 4.0,
                "distance": 300,
                "features": ["快速", "24小时", "儿童友好"],
                "suitable_weather": ["任何天气"],
                "meal_times": ["早餐", "午餐", "晚餐", "夜宵"]
            },
            {
                "name": "海底捞火锅",
                "cuisine_type": "火锅",
                "price_range": "high_end",
                "rating": 4.7,
                "distance": 1200,
                "features": ["服务好", "等位娱乐", "适合聚餐"],
                "suitable_weather": ["寒冷", "下雨"],
                "meal_times": ["午餐", "晚餐"]
            },
            {
                "name": "鲜芋仙",
                "cuisine_type": "甜品",
                "price_range": "economic",
                "rating": 4.1,
                "distance": 400,
                "features": ["清爽", "甜品", "下午茶"],
                "suitable_weather": ["炎热", "晴天"],
                "meal_times": ["下午茶", "夜宵"]
            }
        ]
        
        # 基于策略评分餐厅
        scored_restaurants = []
        for restaurant in sample_restaurants:
            score = self._calculate_restaurant_score(restaurant, context, strategy)
            if score > 0:  # 只包含有正分的餐厅
                restaurant_with_score = restaurant.copy()
                restaurant_with_score["recommendation_score"] = score
                restaurant_with_score["recommendation_reasons"] = self._get_recommendation_reasons(
                    restaurant, context, strategy
                )
                scored_restaurants.append(restaurant_with_score)
        
        # 按评分排序并返回前max_results个
        scored_restaurants.sort(key=lambda x: x["recommendation_score"], reverse=True)
        return scored_restaurants[:max_results]
    
    def _calculate_restaurant_score(self, 
                                  restaurant: Dict[str, Any], 
                                  context: Dict[str, Any], 
                                  strategy: Dict[str, Any]) -> float:
        """
        计算餐厅推荐评分
        """
        score = restaurant.get("rating", 3.0) * 20  # 基础分：评分 * 20
        
        # 距离因子（近的加分）
        distance = restaurant.get("distance", 1000)
        if distance <= 500:
            score += 15
        elif distance <= 1000:
            score += 10
        elif distance <= 2000:
            score += 5
        
        # 天气匹配
        weather_condition = context.get("weather", {}).get("condition", "晴天")
        temperature = context.get("weather", {}).get("temperature", 25)
        
        suitable_weather = restaurant.get("suitable_weather", [])
        if "任何天气" in suitable_weather:
            score += 10
        elif temperature > 30 and "炎热" in suitable_weather:
            score += 15
        elif temperature < 10 and "寒冷" in suitable_weather:
            score += 15
        elif "雨" in weather_condition and "下雨" in suitable_weather:
            score += 15
        
        # 用餐时间匹配
        meal_time = context.get("time", {}).get("meal_time", "")
        if meal_time in restaurant.get("meal_times", []):
            score += 15
        
        # 菜系匹配
        cuisine_suggestions = strategy.get("cuisine_suggestions", [])
        restaurant_cuisine = restaurant.get("cuisine_type", "")
        if any(cuisine in restaurant_cuisine for cuisine in cuisine_suggestions):
            score += 20
        
        # 特殊功能匹配
        restaurant_features = restaurant.get("features", [])
        traffic_level = context.get("traffic", {}).get("congestion_level", "")
        
        if traffic_level in ["严重", "中度"] and "支持外卖" in restaurant_features:
            score += 15
        
        weather_condition = context.get("weather", {}).get("condition", "")
        temperature = context.get("weather", {}).get("temperature", 25)
        if (temperature > 30 or "雨" in weather_condition) and "有空调" in restaurant_features:
            score += 10
        
        return max(score, 0)  # 确保分数不为负
    
    def _get_recommendation_reasons(self, 
                                  restaurant: Dict[str, Any], 
                                  context: Dict[str, Any], 
                                  strategy: Dict[str, Any]) -> List[str]:
        """
        生成推荐理由
        """
        reasons = []
        
        # 基础理由
        rating = restaurant.get("rating", 0)
        if rating >= 4.5:
            reasons.append("评分优秀")
        elif rating >= 4.0:
            reasons.append("评分良好")
        
        # 距离理由
        distance = restaurant.get("distance", 1000)
        if distance <= 300:
            reasons.append("距离很近")
        elif distance <= 800:
            reasons.append("距离适中")
        
        # 天气理由
        temperature = context.get("weather", {}).get("temperature", 25)
        weather_condition = context.get("weather", {}).get("condition", "晴天")
        
        if temperature > 30 and restaurant.get("cuisine_type") in ["甜品", "冷饮"]:
            reasons.append("炎热天气，适合凉爽食品")
        elif temperature < 10 and restaurant.get("cuisine_type") == "火锅":
            reasons.append("寒冷天气，火锅暖身")
        
        # 时间理由
        meal_time = context.get("time", {}).get("meal_time", "")
        if meal_time in restaurant.get("meal_times", []):
            reasons.append(f"适合{meal_time}时段")
        
        # 交通理由
        traffic_level = context.get("traffic", {}).get("congestion_level", "")
        if traffic_level in ["严重", "中度"]:
            if "支持外卖" in restaurant.get("features", []):
                reasons.append("交通拥堵，支持外卖配送")
            elif distance <= 500:
                reasons.append("交通拥堵，步行可达")
        
        # 节假日理由
        is_holiday = context.get("calendar", {}).get("is_holiday", False)
        if is_holiday:
            if "适合聚餐" in restaurant.get("features", []):
                reasons.append("节假日，适合聚餐")
        
        return reasons[:3]  # 最多返回3个理由