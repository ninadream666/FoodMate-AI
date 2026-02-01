from pydantic import BaseModel, Field
from typing import List, Optional

class VisionAnalysisRequest(BaseModel):
    """
    Android 端发送的请求结构
    """
    image_base64: str = Field(..., description="图片的 Base64 编码字符串")
    health_tags: Optional[List[str]] = Field(default=[], description="用户健康标签，如：低糖、过敏原等")

class MenuItem(BaseModel):
    """
    单个菜品的分析结果
    """
    name: str = Field(..., description="菜品名称")
    calories: str = Field(..., description="估算热量")
    ingredients: List[str] = Field(..., description="主要食材成分")
    warnings: Optional[str] = Field(None, description="健康警告")
    is_recommended: bool = Field(False, description="是否属于健康推荐")

class VisionAnalysisResponse(BaseModel):
    """
    返回给 Android 端的结构化结果
    """
    status: str
    items: List[MenuItem]
    top_recommendations: List[str] = Field(..., description="最推荐的 3 个菜品名称")
    health_summary: str = Field(..., description="本次菜单的整体健康总结")