"""
ContextAgent - 环境感知智能体

职责: 
- 观察和分析环境状态（天气、交通、时间）
- 评估环境对外卖配送和用餐体验的影响
- 为决策智能体提供环境上下文

能力:
- 天气分析：调用天气API，分析天气对配送和食物选择的影响
- 交通分析：调用交通API，评估配送时间和区域影响
- 时间感知：分析当前时间、节假日、用餐时段
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import logging
import os
import sys

from .base_agent import BaseAgent, Tool, global_tool_registry

# 添加服务目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)


class ContextAgent(BaseAgent):
    
    def __init__(self, weather_service=None, map_service=None, calendar_service=None):
        super().__init__(
            name="ContextAgent",
            description="环境感知智能体 - 负责观察和分析天气、交通、时间等环境因素"
        )
        
        # 外部API服务（支持依赖注入）
        self.weather_service = weather_service
        self.map_service = map_service
        self.calendar_service = calendar_service
        
        # 注册工具
        self._register_tools()
        
    def _register_tools(self):
        """注册智能体工具到全局工具注册表"""
        
        # 天气分析工具
        weather_tool = Tool(
            name="analyze_weather",
            description="分析当前天气状况及其对外卖配送的影响",
            input_schema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"},
                    "latitude": {"type": "number", "description": "纬度（可选）"},
                    "longitude": {"type": "number", "description": "经度（可选）"}
                }
            },
            handler=self._analyze_weather
        )
        global_tool_registry.register(weather_tool)
        
        # 交通分析工具
        traffic_tool = Tool(
            name="analyze_traffic",
            description="分析交通状况对配送时间的影响",
            input_schema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"},
                    "location": {"type": "string", "description": "具体位置"}
                }
            },
            handler=self._analyze_traffic
        )
        global_tool_registry.register(traffic_tool)
        
        # 时间上下文分析工具
        temporal_tool = Tool(
            name="analyze_temporal_context",
            description="分析时间上下文（节假日、用餐时段等）",
            input_schema={
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "日期（可选，默认今天）"}
                }
            },
            handler=self._analyze_temporal_context
        )
        global_tool_registry.register(temporal_tool)
        
    def get_capabilities(self) -> List[str]:
        """返回智能体能力"""
        return [
            "weather_analysis",      # 天气分析
            "traffic_analysis",      # 交通分析
            "temporal_analysis",     # 时间上下文分析
            "environment_impact",    # 环境影响评估
        ]
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        处理环境感知请求
        
        Args:
            input_data: 包含以下可选字段
                - city: 城市名称
                - latitude: 纬度
                - longitude: 经度
                - location: 具体位置
                
        Returns:
            环境上下文分析结果
        """
        start_time = datetime.now()
        self.update_state("processing", "environment_analysis")
        
        try:
            city = input_data.get("city", "深圳")
            latitude = input_data.get("latitude")
            longitude = input_data.get("longitude")
            location = input_data.get("location", city)

            # 并行获取所有环境数据
            weather_task = self._analyze_weather(city, latitude, longitude)
            traffic_task = self._analyze_traffic(city, latitude, longitude)
            temporal_task = self._analyze_temporal_context()

            weather_result, traffic_result, temporal_result = await asyncio.gather(
                weather_task, traffic_task, temporal_task,
                return_exceptions=True
            )
            
            # 处理异常结果
            if isinstance(weather_result, Exception):
                logger.warning(f"Weather analysis failed: {weather_result}")
                weather_result = self._get_default_weather()
                
            if isinstance(traffic_result, Exception):
                logger.warning(f"Traffic analysis failed: {traffic_result}")
                traffic_result = self._get_default_traffic()
                
            if isinstance(temporal_result, Exception):
                logger.warning(f"Temporal analysis failed: {temporal_result}")
                temporal_result = self._get_default_temporal()
            
            # 综合环境影响评估
            health_context = input_data.get("health_context", {})
            environment_impact = self._evaluate_environment_impact(
                weather_result, traffic_result, temporal_result, health_context
            )
            
            result = {
                "success": True,
                "agent": self.name,
                "weather": weather_result,
                "traffic": traffic_result,
                "temporal": temporal_result,
                "environment_impact": environment_impact,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.state.processing_time_ms = processing_time
            self.update_state("completed", "environment_analysis", result)
            
            logger.info(f"ContextAgent completed analysis in {processing_time:.1f}ms")
            return result
            
        except Exception as e:
            logger.error(f"ContextAgent processing failed: {e}")
            self.update_state("error", error=str(e))
            return {
                "success": False,
                "agent": self.name,
                "error": str(e)
            }
    
    async def _analyze_weather(self, city: str = "深圳",
                                latitude: float = None,
                                longitude: float = None) -> Dict[str, Any]:
        """分析天气状况"""
        try:
            if self.weather_service and latitude and longitude:
                # 使用注入的天气服务（只需要经纬度）
                weather_info = await self.weather_service.get_weather(latitude, longitude)
                if weather_info:
                    weather_data = {
                        "condition": weather_info.condition,
                        "temperature": weather_info.temperature,
                        "humidity": weather_info.humidity,
                        "feels_like": weather_info.feels_like,
                        "wind_speed": weather_info.wind_speed
                    }
                    return self._process_weather_data(weather_data)
            # 返回默认天气数据
            return self._get_default_weather()
        except Exception as e:
            logger.error(f"Weather analysis error: {e}")
            return self._get_default_weather()
    
    def _process_weather_data(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理天气数据，提取关键信息"""
        condition = weather_data.get("condition", "晴")
        temperature = weather_data.get("temperature", 25)
        humidity = weather_data.get("humidity", 60)
        
        # 天气影响评估
        delivery_impact = self._assess_weather_delivery_impact(condition)
        food_suggestions = self._get_weather_food_suggestions(condition, temperature)
        
        return {
            "condition": condition,
            "temperature": temperature,
            "humidity": humidity,
            "delivery_impact": delivery_impact,
            "food_suggestions": food_suggestions,
            "is_bad_weather": self._is_bad_weather(condition),
            "comfort_index": self._calculate_comfort_index(temperature, humidity)
        }
    
    def _assess_weather_delivery_impact(self, condition: str) -> Dict[str, Any]:
        """评估天气对配送的影响"""
        impact_map = {
            "晴": {"level": "low", "delay_minutes": 0, "tips": "天气良好，配送正常"},
            "多云": {"level": "low", "delay_minutes": 0, "tips": "配送正常"},
            "阴": {"level": "low", "delay_minutes": 0, "tips": "配送正常"},
            "小雨": {"level": "medium", "delay_minutes": 10, "tips": "可能略有延迟"},
            "中雨": {"level": "high", "delay_minutes": 20, "tips": "建议选择包装好的餐品"},
            "大雨": {"level": "high", "delay_minutes": 30, "tips": "配送可能延迟，请耐心等待"},
            "暴雨": {"level": "critical", "delay_minutes": 60, "tips": "恶劣天气，强烈建议选择近距离餐厅"},
            "雪": {"level": "high", "delay_minutes": 25, "tips": "道路可能湿滑，请预留时间"},
            "雾": {"level": "medium", "delay_minutes": 15, "tips": "能见度低，配送可能延迟"},
        }
        
        # 模糊匹配
        for key, value in impact_map.items():
            if key in condition:
                return value
        
        return {"level": "low", "delay_minutes": 0, "tips": "配送正常"}
    
    def _get_weather_food_suggestions(self, condition: str, temperature: float) -> List[str]:
        """根据天气推荐食物类型"""
        suggestions = []
        
        # 基于温度的推荐
        if temperature < 10:
            suggestions.extend(["火锅", "麻辣烫", "热汤面", "砂锅"])
        elif temperature < 20:
            suggestions.extend(["面食", "盖浇饭", "炒菜"])
        elif temperature < 30:
            suggestions.extend(["快餐", "便当", "简餐"])
        else:
            suggestions.extend(["凉皮", "冷面", "沙拉", "甜品"])
        
        # 基于天气状况的推荐
        if "雨" in condition:
            suggestions.extend(["热饮", "热汤", "火锅"])
        elif "热" in condition or temperature > 35:
            suggestions.extend(["冷饮", "冰品", "凉菜"])
            
        return list(set(suggestions))[:5]  # 去重并限制数量
    
    def _is_bad_weather(self, condition: str) -> bool:
        """判断是否恶劣天气"""
        bad_conditions = ["大雨", "暴雨", "大雪", "暴雪", "台风", "冰雹", "雷暴"]
        return any(bc in condition for bc in bad_conditions)
    
    def _calculate_comfort_index(self, temperature: float, humidity: float) -> str:
        """计算舒适度指数"""
        if 18 <= temperature <= 25 and 40 <= humidity <= 60:
            return "舒适"
        elif 15 <= temperature <= 28:
            return "较舒适"
        elif temperature < 10 or temperature > 35:
            return "不适"
        else:
            return "一般"
    
    async def _analyze_traffic(self, city: str = "深圳",
                                    latitude: float = None,
                                    longitude: float = None) -> Dict[str, Any]:
        """分析交通状况"""
        try:
            if self.map_service and latitude and longitude:
                traffic_info = await self.map_service.get_traffic_info(latitude, longitude)
                if traffic_info:
                    traffic_data = {
                        "congestion_level": traffic_info.congestion_level,
                        "congestion_index": traffic_info.travel_time_multiplier,  # 使用倍数作为拥堵指数
                        "recommended_transport": traffic_info.recommended_transport
                    }
                    return self._process_traffic_data(traffic_data)
            return self._get_default_traffic()
        except Exception as e:
            logger.error(f"Traffic analysis error: {e}")
            return self._get_default_traffic()
    
    def _process_traffic_data(self, traffic_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理交通数据"""
        congestion_level = traffic_data.get("congestion_level", "畅通")
        congestion_index = traffic_data.get("congestion_index", 1.0)
        
        # 配送区域建议
        delivery_radius = self._recommend_delivery_radius(congestion_index)
        
        return {
            "congestion_level": congestion_level,
            "congestion_index": congestion_index,
            "recommended_delivery_radius": delivery_radius,
            "estimated_delay_factor": max(1.0, congestion_index),
            "tips": self._get_traffic_tips(congestion_level)
        }
    
    def _recommend_delivery_radius(self, congestion_index: float) -> int:
        """根据拥堵程度推荐配送半径"""
        if congestion_index < 1.5:
            return 5000  # 5公里
        elif congestion_index < 2.0:
            return 3000  # 3公里
        elif congestion_index < 2.5:
            return 2000  # 2公里
        else:
            return 1000  # 1公里
    
    def _get_traffic_tips(self, congestion_level: str) -> str:
        """获取交通提示"""
        tips_map = {
            "畅通": "道路畅通，可选择任意距离餐厅",
            "缓行": "轻度拥堵，建议选择3公里内餐厅",
            "拥堵": "交通拥堵，建议选择近距离餐厅",
            "严重拥堵": "严重拥堵，强烈建议选择1公里内餐厅"
        }
        return tips_map.get(congestion_level, "配送正常")
    
    async def _analyze_temporal_context(self, date_str: str = None) -> Dict[str, Any]:
        """分析时间上下文"""
        try:
            if self.calendar_service:
                # 使用正确的方法名 get_calendar_info
                calendar_info = await self.calendar_service.get_calendar_info(date_str)
                if calendar_info:
                    # CalendarInfo 属性：date, weekday, is_holiday, holiday_name, is_work_day
                    weekday_str = calendar_info.weekday if hasattr(calendar_info, 'weekday') else ""
                    # 修复周末判断逻辑，包含更多的周末标识符
                    is_weekend = weekday_str in ["周六", "周日", "星期六", "星期日", "Saturday", "Sunday", "六", "日"]
                    
                    # 如果API没有正确返回周末信息，使用Python的weekday()方法作为备选
                    if not is_weekend:
                        now = datetime.now()
                        is_weekend = now.weekday() >= 5  # 5是周六，6是周日
                    
                    date_data = {
                        "is_holiday": calendar_info.is_holiday if hasattr(calendar_info, 'is_holiday') else False,
                        "is_weekend": is_weekend,
                        "festival": calendar_info.holiday_name if hasattr(calendar_info, 'holiday_name') else None,
                        "weekday": weekday_str
                    }
                    return self._process_temporal_data(date_data)
            return self._get_default_temporal()
                
        except Exception as e:
            logger.error(f"Temporal analysis error: {e}")
            return self._get_default_temporal()
    
    def _process_temporal_data(self, date_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理时间数据"""
        now = datetime.now()
        current_hour = now.hour
        
        # 用餐时段判断
        meal_period = self._get_meal_period(current_hour)
        
        # 是否节假日
        is_holiday = date_data.get("is_holiday", False)
        # 确保周末判断的优先级，优先使用传入的数据，否则使用Python的weekday()方法
        is_weekend = date_data.get("is_weekend")
        if is_weekend is None:
            is_weekend = now.weekday() >= 5  # 0是周一，5是周六，6是周日
        
        # 节日信息
        festival = date_data.get("festival", None)
        
        logger.info(f"时间上下文分析: 当前时间={current_hour}时, 是否周末={is_weekend}, 是否节假日={is_holiday}")
        
        return {
            "current_hour": current_hour,
            "hour": current_hour,  # 兼容字段
            "meal_period": meal_period,
            "is_holiday": is_holiday,
            "is_weekend": is_weekend,
            "festival": festival,
            "is_peak_hour": self._is_peak_hour(current_hour),
            "urgency_level": self._calculate_urgency(current_hour, meal_period),
            "recommendations": self._get_temporal_recommendations(meal_period, is_holiday, festival)
        }
    
    def _get_meal_period(self, hour: int) -> str:
        """判断用餐时段"""
        if 6 <= hour < 10:
            return "breakfast"
        elif 11 <= hour < 14:
            return "lunch"
        elif 14 <= hour < 17:
            return "afternoon_tea"
        elif 17 <= hour < 21:
            return "dinner"
        elif 21 <= hour < 24 or 0 <= hour < 2:
            return "night_snack"
        else:
            return "off_peak"
    
    def _is_peak_hour(self, hour: int) -> bool:
        """判断是否高峰时段"""
        return hour in [11, 12, 13, 18, 19, 20]
    
    def _calculate_urgency(self, hour: int, meal_period: str) -> str:
        """计算紧急程度"""
        if meal_period in ["breakfast", "lunch", "dinner"] and self._is_peak_hour(hour):
            return "high"
        elif meal_period in ["breakfast", "lunch", "dinner"]:
            return "medium"
        else:
            return "low"
    
    def _get_temporal_recommendations(self, meal_period: str, 
                                      is_holiday: bool, 
                                      festival: str = None) -> List[str]:
        """获取基于时间的推荐"""
        recommendations = []
        
        # 基于用餐时段
        period_recommendations = {
            "breakfast": ["早餐", "粥", "包子", "豆浆"],
            "lunch": ["工作餐", "快餐", "便当", "面食"],
            "afternoon_tea": ["甜点", "奶茶", "咖啡", "小吃"],
            "dinner": ["正餐", "火锅", "烧烤", "家常菜"],
            "night_snack": ["宵夜", "烧烤", "麻辣烫", "小龙虾"]
        }
        recommendations.extend(period_recommendations.get(meal_period, []))
        
        # 基于节假日
        if is_holiday:
            recommendations.extend(["聚餐", "家庭套餐"])
        
        # 基于特殊节日
        if festival:
            festival_foods = {
                "情人节": ["浪漫套餐", "西餐", "甜点"],
                "中秋节": ["月饼", "团圆饭"],
                "春节": ["年夜饭", "饺子"],
            }
            for f, foods in festival_foods.items():
                if f in festival:
                    recommendations.extend(foods)
        
        return list(set(recommendations))[:5]
    
    def _evaluate_environment_impact(self, weather: Dict, traffic: Dict, 
                                     temporal: Dict, health_context: Dict = None) -> Dict[str, Any]:
        """综合评估环境影响（含环境光线）"""
        if health_context is None:
            health_context = {}
            
        # 计算综合影响分数
        weather_score = 1.0 if weather.get("is_bad_weather") else 0.0
        traffic_score = min(1.0, (traffic.get("congestion_index", 1.0) - 1.0) / 2.0)
        peak_score = 1.0 if temporal.get("is_peak_hour") else 0.0
        
        # 环境光线影响评估
        light_level = health_context.get("light_level", "normal")
        light_lux = health_context.get("lightLux", health_context.get("light_lux", -1))
        light_impact = "none"
        if light_level in ("dark", "dim"):
            light_impact = "low_light"
        elif light_level in ("bright", "sunlight"):
            light_impact = "high_light"
        
        overall_impact = (weather_score * 0.4 + traffic_score * 0.4 + peak_score * 0.2)
        
        # 影响等级
        if overall_impact < 0.3:
            impact_level = "low"
        elif overall_impact < 0.6:
            impact_level = "medium"
        else:
            impact_level = "high"
        
        # 综合建议
        suggestions = []
        if weather.get("is_bad_weather"):
            suggestions.append("恶劣天气，建议选择包装好的餐品")
        if traffic.get("congestion_index", 1.0) > 1.5:
            suggestions.append(f"交通拥堵，建议选择{traffic.get('recommended_delivery_radius', 3000)}米内餐厅")
        if temporal.get("is_peak_hour"):
            suggestions.append("用餐高峰期，可能需要等待")
        if light_impact == "low_light":
            suggestions.append("当前光线较暗，为您推荐夜间暖食和热饮")
        elif light_impact == "high_light":
            suggestions.append("当前户外光线强烈，为您推荐清爽冰饮")
        
        if light_impact != "none":
            logger.info(f"💡 环境光感知: level={light_level}, lux={light_lux}, impact={light_impact}")
        
        return {
            "overall_score": overall_impact,
            "impact_level": impact_level,
            "weather_impact": weather_score,
            "traffic_impact": traffic_score,
            "peak_impact": peak_score,
            "light_impact": light_impact,
            "light_level": light_level,
            "suggestions": suggestions,
            "recommended_max_distance": traffic.get("recommended_delivery_radius", 5000)
        }
    
    def _get_default_weather(self) -> Dict[str, Any]:
        """默认天气数据"""
        return {
            "condition": "晴",
            "temperature": 25,
            "humidity": 60,
            "delivery_impact": {"level": "low", "delay_minutes": 0, "tips": "配送正常"},
            "food_suggestions": ["快餐", "便当", "炒菜"],
            "is_bad_weather": False,
            "comfort_index": "舒适"
        }
    
    def _get_default_traffic(self) -> Dict[str, Any]:
        """默认交通数据"""
        return {
            "congestion_level": "畅通",
            "congestion_index": 1.0,
            "recommended_delivery_radius": 5000,
            "estimated_delay_factor": 1.0,
            "tips": "道路畅通，可选择任意距离餐厅"
        }
    
    def _get_default_temporal(self) -> Dict[str, Any]:
        """默认时间上下文"""
        now = datetime.now()
        current_hour = now.hour
        is_weekend = now.weekday() >= 5  # 0是周一，5是周六，6是周日
        
        logger.info(f"使用默认时间上下文: 当前时间={current_hour}时, 是否周末={is_weekend}")
        
        return {
            "current_hour": current_hour,
            "hour": current_hour,  # 兼容字段
            "meal_period": self._get_meal_period(current_hour),
            "is_holiday": False,
            "is_weekend": is_weekend,
            "festival": None,
            "is_peak_hour": self._is_peak_hour(current_hour),
            "urgency_level": "medium",
            "recommendations": []
        }


# 工厂函数
def create_context_agent(weather_service=None, map_service=None, 
                        calendar_service=None) -> ContextAgent:
    """创建环境感知智能体实例"""
    return ContextAgent(weather_service, map_service, calendar_service)
