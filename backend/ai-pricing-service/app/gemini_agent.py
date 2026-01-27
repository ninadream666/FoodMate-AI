import httpx
import json
import logging
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        # 使用 OpenAI 兼容接口 (引力AI)
        self.base_url = "https://yinli.one/v1/chat/completions"

    async def analyze_price(self, item_name: str, current_price: float, sales_data: dict) -> dict:
        """
        真实的 AI 分析逻辑
        sales_data 格式: {'totalQuantity': 10, 'totalRevenue': 500}
        """
        if not self.api_key:
            logger.warning("No Gemini API Key found, returning dummy response.")
            return self._dummy_response(current_price)

        qty = sales_data.get('totalQuantity', 0)
        revenue = sales_data.get('totalRevenue', 0)

        # 构造更智能的 Prompt: 角色扮演 + 数据驱动 + 策略建议
        prompt_text = f"""
        你是该餐厅的收益管理总监。
        请根据以下真实运营数据，为菜品 "{item_name}" 制定下周的动态定价策略。

        【核心数据】
        - 当前定价: {current_price} 元
        - 过去7天总销量: {qty} 份
        - 过去7天总营收: {revenue} 元
        
        【市场背景假设】
        1. 滞销品 (Dead Stock): 如果销量极低（<5份），可能价格过高或曝光不足，考虑降价促销 (MARKDOWN) 以清理库存或引流。
        2. 畅销品 (Best Seller): 如果销量极高（>50份），需求强劲，考虑小幅涨价 (SURGE) 以提升利润率。
        3. 稳定品: 如果销量适中且稳定，建议维持原价 (MAINTAIN)。
        
        【决策要求】
        请严格输出纯 JSON 格式（不要Markdown代码块，不要```json）：
        {{
            "suggested_price": float, 
            "strategy_type": "MARKDOWN" | "SURGE" | "MAINTAIN",
            "reasoning": "简短的中文理由 (30字以内，解释依据)"
        }}
        """

        # 构造 OpenAI 兼容格式 Payload
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                {"role": "user", "content": prompt_text}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url=self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Gemini API Error: {response.text}")
                    return self._dummy_response(current_price)

                data = response.json()
                # 解析 OpenAI 兼容响应结构
                try:
                    text_content = data["choices"][0]["message"]["content"]
                    # 清理可能的 markdown 标记
                    cleaned_text = text_content.replace("```json", "").replace("```", "").strip()
                    return json.loads(cleaned_text)
                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    # 注意：这里 text_content 可能未定义如果解析失败，需要小心处理
                    logger.error(f"Error parsing Gemini response: {e}")
                    return self._dummy_response(current_price)

        except Exception as e:
            logger.error(f"Gemini Analysis Failed: {e}")
            return self._dummy_response(current_price)

    def _dummy_response(self, current_price):
        return {
            "suggested_price": current_price,
            "strategy_type": "MAINTAIN",
            "reasoning": "AI 服务暂时不可用"
        }

gemini_client = GeminiClient()