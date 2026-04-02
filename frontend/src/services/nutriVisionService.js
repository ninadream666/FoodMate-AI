import apiClient, { cancelServiceRequests } from './apiClient';
import SERVICE_URLS from '../config/serviceConfig';

// 图片 Base64 最大允许大小 (4MB 字符 ≈ 3MB 原始图片)
const MAX_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024;

/**
 * 视觉大模型服务
 */
export const nutriVisionService = {
    /**
     * 分析菜单图片 (多模态识图模式)
     * @param {string} imageBase64 - 图片的 Base64 字符串
     * @param {string[]} healthTags - 用户健康标签
     * @returns {Promise<VisionAnalysisResponse>}
     */
    analyzeMenu: async (imageBase64, healthTags = []) => {
        // 前端拦截：超大图片直接拒绝，避免浪费带宽和后端资源
        if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
            throw new Error(`图片过大 (${(imageBase64.length / 1024 / 1024).toFixed(1)}MB)，请选择更小的图片或重新拍摄`);
        }

        try {
            const response = await apiClient.post('nutrivision', '/api/v1/vision/analyze', {
                image_base64: imageBase64,
                health_tags: healthTags
            }, {
                timeout: 120000, // 菜单分析可能较慢，120s超时
            });
            return response;
        } catch (error) {
            console.error('NutriVision Menu Analysis Failed:', error);
            throw error;
        }
    },

    /**
     * 分析单道菜品图片 (CV本地识别 + LLM知识图谱模式)
     * @param {string} imageBase64 - 图片的 Base64 字符串
     * @param {string[]} healthTags - 用户健康标签
     * @returns {Promise<VisionAnalysisResponse>}
     */
    analyzeFood: async (imageBase64, healthTags = []) => {
        if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
            throw new Error(`图片过大 (${(imageBase64.length / 1024 / 1024).toFixed(1)}MB)，请选择更小的图片或重新拍摄`);
        }

        try {
            const response = await apiClient.post('nutrivision', '/api/v1/vision/analyze-food', {
                image_base64: imageBase64,
                health_tags: healthTags
            }, {
                timeout: 60000, // 单品分析走CV快速通道，60s够用
            });
            return response;
        } catch (error) {
            console.error('NutriVision Food Analysis Failed:', error);
            throw error;
        }
    },

    /**
     * 取消所有进行中的 NutriVision 请求
     * 用于用户返回上一页时释放资源
     */
    cancelPending: () => {
        cancelServiceRequests('nutrivision');
    },
};
