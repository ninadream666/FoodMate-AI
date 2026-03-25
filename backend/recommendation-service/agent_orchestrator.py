"""
智能体编排系统 - 基于ReAct模式的推理引擎
实现Context Assembly -> Agent Orchestration -> Decision & Output三层架构
支持 OpenAI 和 DeepSeek API
"""

import json
import asyncio
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import openai
from dataclasses import dataclass
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RecommendationContext:
    """推荐上下文数据结构"""
    weather_data: Dict[str, Any]
    traffic_data: Dict[str, Any] 
    date_data: Dict[str, Any]
    restaurants_data: Dict[str, Any]
    user_context: Dict[str, Any]
    raw_query: str
    location: str

@dataclass
class RecommendationResult:
    """推荐结果数据结构"""
    recommended_restaurants: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    context_factors: Dict[str, Any]
    alternative_suggestions: List[str]

class SmartRecommendationOrchestrator:
    """智能推荐编排器 - 核心ReAct引擎"""
    
    def __init__(self, openai_api_key: str, model_name: str = None):
        """
        初始化智能体编排器
        支持 OpenAI 和 DeepSeek API
        
        Args:
            openai_api_key: API密钥（OpenAI 或 DeepSeek）
            model_name: 使用的模型名称
        """
        # 检查是否使用 DeepSeek
        self.use_deepseek = os.getenv("USE_DEEPSEEK", "false").lower() == "true"
        deepseek_key = os.getenv("DEEPSEEK_API_KEY")

        if self.use_deepseek and deepseek_key:
            # 使用 DeepSeek API
            self.openai_client = openai.AsyncOpenAI(
                api_key=deepseek_key,
                base_url="https://api.deepseek.com"
            )
            self.model_name = model_name or os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
            logger.info(f"✅ 使用 DeepSeek API，模型: {self.model_name}")
        else:
            # 使用 OpenAI API
            self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
            self.model_name = model_name or os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
            logger.info(f"✅ 使用 OpenAI API，模型: {self.model_name}")
        
        # ReAct系统提示词模板
        self.system_prompt = """
你是一个极具同理心的外卖推荐专家，擅长基于多维度环境因素进行智能决策。

# 核心能力
1. **环境感知**: 深度分析天气、交通、时间、节日等环境因素
2. **用户理解**: 洞察用户偏好、历史行为和当前需求
3. **智能推理**: 运用ReAct思维模式（推理+行动）进行决策
4. **情感关怀**: 考虑用户在不同情境下的情感需求

# 决策框架 (ReAct Pattern)
**Thought**: 分析当前情况和各种因素
**Action**: 基于分析选择推荐策略  
**Observation**: 评估推荐效果和用户满意度

# 推荐原则
1. **安全第一**: 恶劣天气优先推荐配送快、包装好的餐厅
2. **效率优先**: 交通拥堵时降低远距离餐厅权重
3. **情景匹配**: 节日推荐特色套餐，工作日推荐快餐
4. **个性化**: 结合用户历史偏好和当前状态
5. **体验导向**: 确保用户获得满意的用餐体验

# 输出要求
返回JSON格式，包含：
- recommended_restaurants: 推荐餐厅列表（3家，按优先级排序）
- reasoning: 详细的推理过程和决策依据
- confidence_score: 推荐信心分数 (0-1)
- context_factors: 影响决策的关键因素
- alternative_suggestions: 备选建议

请基于提供的环境数据和用户信息，进行深度推理和智能推荐。
"""

    async def orchestrate_recommendation(self, context: RecommendationContext) -> RecommendationResult:
        """
        核心编排方法 - 执行完整的ReAct推理流程
        
        Args:
            context: 推荐上下文数据
            
        Returns:
            RecommendationResult: 结构化推荐结果
        """
        try:
            logger.info(f"开始智能体编排推荐流程，查询: {context.raw_query}")
            
            # 第一步：Context Assembly (上下文聚合)
            processed_context = await self._assemble_context(context)
            
            # 第二步：Agent Orchestration (智能推理)
            reasoning_result = await self._execute_react_reasoning(processed_context)
            
            # 第三步：Decision & Output (决策输出)
            final_result = await self._format_final_output(reasoning_result, context)
            
            logger.info(f"推荐编排完成，置信度: {final_result.confidence_score}")
            return final_result
            
        except Exception as e:
            logger.error(f"智能体编排失败: {str(e)}")
            return await self._fallback_recommendation(context)

    async def _assemble_context(self, context: RecommendationContext) -> Dict[str, Any]:
        """
        第一层：Context Assembly (上下文聚合层)
        数据预处理和清洗，符合"Thinking with the data pipeline"理念
        """
        try:
            # 解析各类环境数据
            weather_info = json.loads(context.weather_data) if isinstance(context.weather_data, str) else context.weather_data
            traffic_info = json.loads(context.traffic_data) if isinstance(context.traffic_data, str) else context.traffic_data  
            date_info = json.loads(context.date_data) if isinstance(context.date_data, str) else context.date_data
            restaurants_info = json.loads(context.restaurants_data) if isinstance(context.restaurants_data, str) else context.restaurants_data
            user_info = json.loads(context.user_context) if isinstance(context.user_context, str) else context.user_context
            
            # 提取关键决策因素
            key_factors = {
                "weather_impact": {
                    "condition": weather_info.get("weather", "未知"),
                    "temperature": weather_info.get("temperature", "未知"),
                    "delivery_impact": weather_info.get("delivery_impact", "无影响"),
                    "food_suggestions": weather_info.get("food_preference_suggestion", [])
                },
                "traffic_impact": {
                    "congestion_level": traffic_info.get("congestion_level", "正常"),
                    "delivery_zones": traffic_info.get("delivery_zones", []),
                    "recommendation": traffic_info.get("recommendation", "")
                },
                "temporal_context": {
                    "is_weekend": date_info.get("is_weekend", False),
                    "is_holiday": date_info.get("is_holiday", False),
                    "holiday_name": date_info.get("holiday_name"),
                    "meal_period": date_info.get("meal_time_context", {}).get("meal_period", "其他时间"),
                    "urgency_level": date_info.get("meal_time_context", {}).get("urgency_level", "低"),
                    "season_recommendations": date_info.get("recommended_categories", [])
                },
                "user_preferences": {
                    "cuisine_types": user_info.get("preferences", {}).get("cuisine_types", []),
                    "budget_range": user_info.get("current_context", {}).get("budget_range", "30-60元"),
                    "time_sensitivity": user_info.get("current_context", {}).get("time_sensitivity", "一般"),
                    "weather_preferences": user_info.get("behavioral_patterns", {}).get("weather_preferences", {})
                },
                "available_restaurants": restaurants_info.get("restaurants", [])
            }
            
            return {
                "processed_factors": key_factors,
                "original_query": context.raw_query,
                "location": context.location,
                "processing_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"上下文聚合失败: {str(e)}")
            return {"error": str(e), "raw_context": context}

    async def _execute_react_reasoning(self, processed_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        第二层：Agent Orchestration (智能编排层)
        基于ReAct模式的推理决策
        """
        try:
            # 构建推理提示词
            reasoning_prompt = self._build_reasoning_prompt(processed_context)
            
            # 调用大模型进行ReAct推理
            response = await self.openai_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": reasoning_prompt}
                ],
                temperature=0.3,  # 较低温度确保推理稳定性
                max_tokens=2000
            )
            
            # 解析推理结果
            reasoning_text = response.choices[0].message.content
            
            try:
                # 尝试解析为JSON
                reasoning_result = json.loads(reasoning_text)
            except json.JSONDecodeError:
                # 如果不是标准JSON，包装为结构化数据
                reasoning_result = {
                    "reasoning_text": reasoning_text,
                    "structured_output": False
                }
            
            return reasoning_result
            
        except Exception as e:
            logger.error(f"ReAct推理失败: {str(e)}")
            return {"error": str(e), "fallback_mode": True}

    def _build_reasoning_prompt(self, processed_context: Dict[str, Any]) -> str:
        """构建ReAct推理提示词"""
        
        factors = processed_context.get("processed_factors", {})
        
        prompt = f"""
# 当前推荐任务
**用户查询**: {processed_context.get("original_query", "智能推荐餐厅")}
**位置**: {processed_context.get("location", "未指定")}
**时间**: {processed_context.get("processing_timestamp", datetime.now().isoformat())}

# 环境因素分析

## 🌤️ 天气状况
- 天气: {factors.get("weather_impact", {}).get("condition", "未知")}
- 温度: {factors.get("weather_impact", {}).get("temperature", "未知")}
- 配送影响: {factors.get("weather_impact", {}).get("delivery_impact", "无影响")}
- 建议食物类型: {factors.get("weather_impact", {}).get("food_suggestions", [])}

## 🚦 交通状况  
- 拥堵程度: {factors.get("traffic_impact", {}).get("congestion_level", "正常")}
- 配送建议: {factors.get("traffic_impact", {}).get("recommendation", "")}

## 📅 时间和节日
- 是否周末: {factors.get("temporal_context", {}).get("is_weekend", False)}
- 是否节假日: {factors.get("temporal_context", {}).get("is_holiday", False)}
- 节日名称: {factors.get("temporal_context", {}).get("holiday_name", "无")}
- 用餐时段: {factors.get("temporal_context", {}).get("meal_period", "其他时间")}
- 紧急程度: {factors.get("temporal_context", {}).get("urgency_level", "低")}
- 季节推荐: {factors.get("temporal_context", {}).get("season_recommendations", [])}

## 👤 用户偏好
- 喜欢菜系: {factors.get("user_preferences", {}).get("cuisine_types", [])}
- 预算范围: {factors.get("user_preferences", {}).get("budget_range", "30-60元")}
- 时间敏感度: {factors.get("user_preferences", {}).get("time_sensitivity", "一般")}

## 🏪 可选餐厅
{json.dumps(factors.get("available_restaurants", []), ensure_ascii=False, indent=2)}

# 请运用ReAct推理模式分析并推荐

请按照以下格式进行思考和输出：

**Thought**: 
基于以上信息，我需要考虑哪些关键因素？用户在当前情境下最需要什么？

**Action**: 
我将采用什么推荐策略？如何平衡各种因素？

**Observation**: 
这个推荐策略预期效果如何？用户满意度如何？

最后输出JSON格式的推荐结果。
"""
        return prompt

    async def _format_final_output(self, reasoning_result: Dict[str, Any], context: RecommendationContext) -> RecommendationResult:
        """
        第三层：Decision & Output (决策输出层)
        格式化最终推荐结果
        """
        try:
            # 如果推理结果是结构化的
            if reasoning_result.get("structured_output", True) and "error" not in reasoning_result:
                return RecommendationResult(
                    recommended_restaurants=reasoning_result.get("recommended_restaurants", []),
                    reasoning=reasoning_result.get("reasoning", "智能推理完成"),
                    confidence_score=reasoning_result.get("confidence_score", 0.8),
                    context_factors=reasoning_result.get("context_factors", {}),
                    alternative_suggestions=reasoning_result.get("alternative_suggestions", [])
                )
            
            # 如果推理结果是文本格式，进行解析
            else:
                return await self._parse_text_reasoning(reasoning_result, context)
                
        except Exception as e:
            logger.error(f"输出格式化失败: {str(e)}")
            return await self._fallback_recommendation(context)

    async def _parse_text_reasoning(self, reasoning_result: Dict[str, Any], context: RecommendationContext) -> RecommendationResult:
        """解析文本格式的推理结果"""
        
        # 简单的fallback推荐逻辑
        restaurants_data = json.loads(context.restaurants_data) if isinstance(context.restaurants_data, str) else context.restaurants_data
        restaurants = restaurants_data.get("restaurants", [])
        
        # 基于简单规则选择前3个餐厅
        selected_restaurants = restaurants[:3]
        
        return RecommendationResult(
            recommended_restaurants=selected_restaurants,
            reasoning=reasoning_result.get("reasoning_text", "基于智能分析完成推荐"),
            confidence_score=0.7,
            context_factors={"mode": "text_parsing"},
            alternative_suggestions=["可尝试其他菜系", "关注优惠活动"]
        )

    async def _fallback_recommendation(self, context: RecommendationContext) -> RecommendationResult:
        """降级推荐策略"""
        try:
            restaurants_data = json.loads(context.restaurants_data) if isinstance(context.restaurants_data, str) else context.restaurants_data
            restaurants = restaurants_data.get("restaurants", [])
            
            # 基于距离和评分的简单排序
            sorted_restaurants = sorted(
                restaurants, 
                key=lambda x: (x.get("distance_km", 999), -x.get("rating", 0))
            )
            
            return RecommendationResult(
                recommended_restaurants=sorted_restaurants[:3],
                reasoning="系统采用基础推荐策略：优先考虑距离近、评分高的餐厅",
                confidence_score=0.6,
                context_factors={"mode": "fallback", "sort_by": "distance_and_rating"},
                alternative_suggestions=["建议稍后重试智能推荐", "可手动筛选餐厅"]
            )
            
        except Exception as e:
            logger.error(f"降级推荐也失败: {str(e)}")
            return RecommendationResult(
                recommended_restaurants=[],
                reasoning=f"推荐系统暂时不可用: {str(e)}",
                confidence_score=0.0,
                context_factors={"error": str(e)},
                alternative_suggestions=["请检查网络连接", "稍后重试"]
            )

# 便捷函数：创建编排器实例
def create_orchestrator(openai_api_key: str, model_name: str = None) -> SmartRecommendationOrchestrator:
    """
    创建智能推荐编排器实例
    
    Args:
        openai_api_key: OpenAI API密钥
        model_name: 模型名称（可选，自动根据环境变量选择）
        
    Returns:
        SmartRecommendationOrchestrator: 编排器实例
    """
    return SmartRecommendationOrchestrator(openai_api_key, model_name)

# 测试函数
async def test_orchestrator():
    """测试智能体编排系统"""
    import os
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("请设置OPENAI_API_KEY环境变量")
        return
    
    orchestrator = create_orchestrator(api_key)
    
    # 模拟测试数据
    test_context = RecommendationContext(
        weather_data='{"weather": "小雨", "temperature": "15°C", "delivery_impact": "中等影响"}',
        traffic_data='{"congestion_level": "严重拥堵", "recommendation": "优先选择2公里内餐厅"}',
        date_data='{"is_holiday": True, "holiday_name": "情人节", "meal_period": "晚餐时间"}',
        restaurants_data='{"restaurants": [{"name": "暖心粥铺", "rating": 4.8, "distance_km": 1.2}]}',
        user_context='{"preferences": {"cuisine_types": ["川菜"], "budget_range": "50-100元"}}',
        raw_query="帮我推荐适合情人节的餐厅",
        location="市中心"
    )
    
    result = await orchestrator.orchestrate_recommendation(test_context)
    print("推荐结果:")
    print(json.dumps(result.__dict__, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(test_orchestrator())