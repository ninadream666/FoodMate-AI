import apiClient from './apiClient';
import SERVICE_URLS from '../config/serviceConfig';

/**
 * 视觉大模型服务
 */
export const nutriVisionService = {
    /**
     * 分析菜单图片
     * @param {string} imageBase64 - 图片的 Base64 字符串 (不带 data:image/jpeg;base64, 前缀)
     * @param {string[]} healthTags - 用户健康标签 ["花生过敏", "低糖"]
     * @returns {Promise<VisionAnalysisResponse>}
     */
    analyzeMenu: async (imageBase64, healthTags = []) => {
        try {
            // 根据 main.py，endpoint 是 /api/v1/vision/analyze
            // serviceKey 是 'nutrivision'
            // 注意：图片可能较大，我们可以在这里增加特定的超时配置，但这需要 apiClient 支持
            // 目前复用 apiClient 的默认逻辑
            const response = await apiClient.post('nutrivision', '/api/v1/vision/analyze', {
                image_base64: imageBase64,
                health_tags: healthTags
            });
            return response;
        } catch (error) {
            console.error('NutriVision Analysis Failed:', error);
            throw error;
        }
    }
};