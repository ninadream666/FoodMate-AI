import logging
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import ValidationError
from .models.schemas import VisionAnalysisRequest, VisionAnalysisResponse
from .core.gemini_vision import vision_client
from .core.config import settings

# 配置日志格式，确保包含时间、级别和消息
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "nutrivision-service"}

@app.post("/api/v1/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_menu(request: VisionAnalysisRequest):
    # 记录请求信息，包括 Base64 长度以便排查 Payload 问题
    img_len = len(request.image_base64)
    logger.info(f"收到分析请求. 标签: {request.health_tags}, 图片Base64长度: {img_len}")
    
    # 如果图片太大（比如超过 4MB 的字符长度，约 5.3M 字符），记录警告
    if img_len > 5 * 1024 * 1024:
        logger.warning(f"检测到超大图片输入 ({img_len} 字符)，可能会导致 API 调用失败或超时。")

    try:
        # 调用 AI 客户端
        result = await vision_client.analyze_menu(request.image_base64, request.health_tags)
        
        # 构造响应体
        response_data = {
            "status": "success",
            **result
        }
        
        # 检查是否是返回了错误信息包
        if "分析暂不可用" in result.get("health_summary", ""):
            logger.error(f"AI 分析返回了错误占位符: {result.get('health_summary')}")
        
        return response_data

    except ValidationError as ve:
        logger.error(f"响应模型校验失败! 接收到的数据: {result}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="AI 返回数据格式不符合规范")
    
    except Exception as e:
        # 打印详细堆栈，解决 str(e) 为空看不到错误的问题
        logger.error(f"处理请求时发生未预期异常: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {type(e).__name__}")