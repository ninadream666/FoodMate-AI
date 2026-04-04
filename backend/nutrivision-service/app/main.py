import logging
import traceback
import time
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import ValidationError
from .models.schemas import VisionAnalysisRequest, SingleFoodAnalysisRequest, VisionAnalysisResponse
from .core.gpt_vision import vision_client
from .core.food_classifier import food_classifier
from .core.config import settings

# 配置日志格式，确保包含时间、级别和消息
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# ============ 网络性能优化中间件 ============

# GZip压缩：响应体>500字节时自动压缩，减少50-80%的传输体积
app.add_middleware(GZipMiddleware, minimum_size=500)

# 请求体大小限制：最大10MB (Base64图片+JSON开销)
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024

@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    """拦截超大请求体，防止内存溢出"""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BODY_SIZE:
        logger.warning(f"请求体过大被拒绝: {content_length} bytes from {request.client.host}")
        raise HTTPException(
            status_code=413,
            detail=f"请求体过大，最大允许 {MAX_REQUEST_BODY_SIZE // (1024*1024)}MB"
        )
    return await call_next(request)

# 并发限制：最多同时处理5个图片分析请求，防止大流量时GPU/API过载
VISION_SEMAPHORE = asyncio.Semaphore(5)

async def acquire_semaphore(timeout: float = 30.0):
    """带超时的信号量获取，排队超时则快速失败"""
    try:
        await asyncio.wait_for(VISION_SEMAPHORE.acquire(), timeout=timeout)
        return True
    except asyncio.TimeoutError:
        return False


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nutrivision-service"}

# ================= 拍菜单模式 =================
@app.post("/api/v1/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_menu(request: VisionAnalysisRequest):
    # 记录请求信息，包括Base64长度以便排查Payload问题
    img_len = len(request.image_base64)
    logger.info(f"[菜单模式] 收到分析请求. 标签: {request.health_tags}, 图片Base64长度: {img_len}")

    # 硬性拒绝超大图片，保护下游API
    if img_len > 5 * 1024 * 1024:
        logger.warning(f"图片过大被拒绝 ({img_len} 字符)")
        raise HTTPException(status_code=413, detail="图片过大，请压缩后重试（建议 < 3MB）")

    # 并发控制：排队超时则快速失败
    acquired = await acquire_semaphore(timeout=30.0)
    if not acquired:
        logger.warning("[菜单模式] 并发请求过多，排队超时")
        raise HTTPException(status_code=429, detail="当前分析请求较多，请稍后重试")

    try:
        # 调用AI客户端
        result = await vision_client.analyze_menu(request.image_base64, request.health_tags)

        # 构造响应体
        response_data = {
            "status": "success",
            **result
        }

        # 检查是否返回了错误信息包
        if "分析暂不可用" in result.get("health_summary", ""):
            logger.error(f"AI 分析返回了错误占位符: {result.get('health_summary')}")

        return response_data

    except ValidationError as ve:
        logger.error(f"响应模型校验失败! 接收到的数据: {result}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="AI 返回数据格式不符合规范")

    except Exception as e:
        # 打印详细堆栈，解决str(e)为空看不到错误的问题
        logger.error(f"处理请求时发生未预期异常: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {type(e).__name__}")
    finally:
        VISION_SEMAPHORE.release()


# ================= 拍菜品模式 =================
@app.post("/api/v1/vision/analyze-food", response_model=VisionAnalysisResponse)
async def analyze_single_food(request: SingleFoodAnalysisRequest):
    img_len = len(request.image_base64)
    logger.info(f"[单品模式] 收到极速分析请求. 标签: {request.health_tags}, 图片Base64长度: {img_len}")

    if img_len > 5 * 1024 * 1024:
        logger.warning(f"图片过大被拒绝 ({img_len} 字符)")
        raise HTTPException(status_code=413, detail="图片过大，请压缩后重试（建议 < 3MB）")

    acquired = await acquire_semaphore(timeout=30.0)
    if not acquired:
        logger.warning("[单品模式] 并发请求过多，排队超时")
        raise HTTPException(status_code=429, detail="当前分析请求较多，请稍后重试")

    try:
        start_time = time.time()

        # 调用本地自研 CV 模型进行极致精度的毫秒级分类
        # 解包返回值，获取分类名和置信度
        food_name, confidence = food_classifier.predict(request.image_base64)
        cv_time = time.time()
        logger.info(f"[CV 阶段] 本地模型识别完成: {food_name}, 置信度: {confidence:.4f}, 耗时: {cv_time - start_time:.4f}s")

        # 阈值判定：如果置信度低于60%或者完全未识别，则启动大模型兜底
        CONFIDENCE_THRESHOLD = 0.60
        if food_name == "Unknown Food" or confidence < CONFIDENCE_THRESHOLD:
            logger.warning(f"[兜底触发] CV识别置信度过低 ({confidence:.4f} < {CONFIDENCE_THRESHOLD}) 或未识别，转交云端大模型兜底...")

            result = await vision_client.analyze_image_fallback(request.image_base64, request.health_tags)
            llm_time = time.time()
            logger.info(f"[LLM 阶段] 云端视觉大模型兜底分析完成, 耗时: {llm_time - cv_time:.4f}s")

            # 隐藏前缀，直接展示健康建议
            if not result.get("health_summary", "").startswith("分析暂不可用"):
                enhanced_summary = "根据您的健康档案，" + result.get("health_summary", "")
                result["health_summary"] = enhanced_summary

        else:
            # 置信度很高，直接将纯文本发给大模型做知识扩展
            result = await vision_client.analyze_single_food(food_name, request.health_tags)
            llm_time = time.time()
            logger.info(f"[LLM 阶段] 云端知识图谱扩展完成, 耗时: {llm_time - cv_time:.4f}s")

            # 隐藏前缀，直接展示健康建议
            if not result.get("health_summary", "").startswith("分析暂不可用"):
                enhanced_summary = "根据您的健康档案，" + result.get("health_summary", "")
                result["health_summary"] = enhanced_summary

        response_data = {
            "status": "success",
            **result
        }
        return response_data

    except ValidationError as ve:
        logger.error(f"响应模型校验失败! 错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="AI 返回数据格式不符合规范")
    except Exception as e:
        logger.error(f"处理单品分析请求时发生异常: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"双模型协同分析失败: {type(e).__name__}")
    finally:
        VISION_SEMAPHORE.release()
