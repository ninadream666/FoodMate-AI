import httpx
import json
import logging
import re
from .config import settings

logger = logging.getLogger(__name__)

class NutriVisionClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = settings.GEMINI_BASE_URL

    async def analyze_menu(self, image_base64: str, health_tags: list) -> dict:
        if not self.api_key:
            return self._error_msg("Backend API Key is missing")

        # 1. Base64 预处理：剥离可能存在的前缀
        # 匹配 data:image/xxx;base64, 格式并保留后面的内容
        clean_base64 = re.sub(r'^data:image/.+;base64,', '', image_base64)

        # 2. 构造强约束 Prompt
        tags_info = "、".join(health_tags) if health_tags else "无特殊偏好"
        prompt = f"""
        你是一位专业的数字营养师。请识别图片菜单中的菜品，并根据用户背景【{tags_info}】给出健康建议。

        必须严格按照以下 JSON 格式返回，禁止包含任何 Markdown 标记或额外说明文字：
        {{
          "items": [
            {{
              "name": "菜品名称",
              "calories": "估算热量(如: 250kcal)",
              "ingredients": ["食材1", "食材2"],
              "warnings": "过敏原或禁忌说明，若无则为空",
              "is_recommended": true
            }}
          ],
          "top_recommendations": ["最推荐的菜名1", "最推荐的菜名2", "最推荐的菜名3"],
          "health_summary": "针对用户标签的整体饮食建议"
        }}
        
        注意：ingredients 字段必须是字符串列表，不能是单个字符串。
        """

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{clean_base64}"}
                        }
                    ]
                }
            ],
            # 某些中转站要求开启 json_object 模式时，Prompt 必须包含 "json" 词汇
            "response_format": {"type": "json_object"}
        }

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.base_url, headers=headers, json=payload, timeout=60.0)
                
                if response.status_code != 200:
                    logger.error(f"AI API Error Status: {response.status_code}, Body: {response.text}")
                    return self._error_msg(f"云端接口响应异常: {response.status_code}")
                
                resp_json = response.json()
                raw_content = resp_json["choices"][0]["message"]["content"]
                
                # 3. 结果清洗与防御性处理
                cleaned_text = raw_content.replace("```json", "").replace("```", "").strip()
                parsed_data = json.loads(cleaned_text)

                # 4. 重点：处理返回结果是 List 的情况（解决 TypeError）
                if isinstance(parsed_data, list):
                    logger.warning("AI returned a list instead of an object, wrapping it.")
                    parsed_data = {"items": parsed_data}

                # 5. 字段对齐与缺失填充
                return self._standardize_response(parsed_data)

        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode Error: {str(e)}, Raw: {raw_content}")
            return self._error_msg("AI 返回格式非标准 JSON")
        except Exception as e:
            logger.error(f"Vision Analysis Exception: {str(e)}")
            return self._error_msg(str(e))

    def _standardize_response(self, data: dict) -> dict:
        """
        确保返回的数据结构 100% 匹配 VisionAnalysisResponse schema
        """
        # 尝试兼容不同的 AI 命名习惯
        items = data.get("items") or data.get("dishes") or data.get("menu_items") or []
        
        standard_items = []
        for item in items:
            if not isinstance(item, dict): continue
            
            # 确保 ingredients 是列表
            ing = item.get("ingredients", [])
            if isinstance(ing, str):
                ing = [i.strip() for i in ing.split("、")]

            standard_items.append({
                "name": item.get("name", "未知菜品"),
                "calories": item.get("calories", "热量待估"),
                "ingredients": ing,
                "warnings": item.get("warnings", ""),
                "is_recommended": item.get("is_recommended", False)
            })

        return {
            "items": standard_items,
            "top_recommendations": data.get("top_recommendations", [])[:3],
            "health_summary": data.get("health_summary") or data.get("summary") or "分析完成。"
        }

    def _error_msg(self, msg):
        return {
            "items": [], 
            "top_recommendations": [], 
            "health_summary": f"分析暂不可用: {msg}"
        }

vision_client = NutriVisionClient()