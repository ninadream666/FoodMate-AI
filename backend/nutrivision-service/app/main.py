import logging
import traceback
import time
from fastapi import FastAPI, HTTPException
from pydantic import ValidationError
from .models.schemas import VisionAnalysisRequest, SingleFoodAnalysisRequest, VisionAnalysisResponse
from .core.gemini_vision import vision_client
from .core.food_classifier import food_classifier
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

# ================= 原有接口：拍菜单模式 (强依赖 LLM 识图) =================
@app.post("/api/v1/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_menu(request: VisionAnalysisRequest):
    # 记录请求信息，包括 Base64 长度以便排查 Payload 问题
    img_len = len(request.image_base64)
    logger.info(f"[菜单模式] 收到分析请求. 标签: {request.health_tags}, 图片Base64长度: {img_len}")
    
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


# ================= 新增接口：拍菜品模式 (CV本地识别 + LLM知识图谱) =================
@app.post("/api/v1/vision/analyze-food", response_model=VisionAnalysisResponse)
async def analyze_single_food(request: SingleFoodAnalysisRequest):
    img_len = len(request.image_base64)
    logger.info(f"[单品模式] 收到极速分析请求. 标签: {request.health_tags}, 图片Base64长度: {img_len}")

    try:
        start_time = time.time()
        
        # 第一阶段：调用本地自研 CV 模型进行极致精度的毫秒级分类
        # 这里解包返回值，获取分类名和置信度
        food_name, confidence = food_classifier.predict(request.image_base64)
        cv_time = time.time()
        logger.info(f"[CV 阶段] 本地模型识别完成: {food_name}, 置信度: {confidence:.4f}, 耗时: {cv_time - start_time:.4f}s")
        
        # 阈值判定：如果置信度低于 60% 或者完全未识别，则启动大模型兜底
        CONFIDENCE_THRESHOLD = 0.60
        if food_name == "Unknown Food" or confidence < CONFIDENCE_THRESHOLD:
            logger.warning(f"[兜底触发] CV识别置信度过低 ({confidence:.4f} < {CONFIDENCE_THRESHOLD}) 或未识别，转交云端大模型兜底...")
            
            # 分支 B：直接传原图给 Gemini 的兜底接口
            result = await vision_client.analyze_image_fallback(request.image_base64, request.health_tags)
            llm_time = time.time()
            logger.info(f"[LLM 阶段] 云端视觉大模型兜底分析完成, 耗时: {llm_time - cv_time:.4f}s")
            
            # 隐藏前缀，直接展示健康建议
            if not result.get("health_summary", "").startswith("分析暂不可用"):
                enhanced_summary = "根据您的健康档案，" + result.get("health_summary", "")
                result["health_summary"] = enhanced_summary

        else:
            # 分支 A：置信度很高，直接将纯文本发给大模型做知识扩展（极速模式）
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