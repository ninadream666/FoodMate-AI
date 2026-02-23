/**
 * edgeSynergyService.ts - 端云协同“看门狗”引擎 (SLM 版)
 * * 核心职责：
 * 1. 接收端侧大语言模型 (SLM) 直接解析好的标准 JSON 对象。
 * 2. 调度与云端 Agent 的交互，将脱敏 Payload 发送给云端。
 * 3. 向 UI 层提供降级建议。
 */

import { recommendationService } from './recommendationService';

export interface EdgeSynergyResult {
    success: boolean;
    isFallbackNeeded: boolean;
    message?: string;
    data?: any;
}

class EdgeSynergyEngine {
    
    /**
     * 处理端侧大模型解析完成后的 JSON，执行完整的端云协同推荐流程
     */
    public async processVoiceIntent(
        parsedConstraints: any, 
        location: any,
        weatherContext: any
    ): Promise<EdgeSynergyResult> {
        
        console.log(`[Edge] 接收到 SLM 结构化约束:`, parsedConstraints);

        // 1. 获取安全的Query (业务意图)
        let safeQuery = parsedConstraints.query || "附近符合要求的推荐";

        // 2. 整理绝对隐私约束 Payload
        const constraints = {
            forbidden_ingredients: parsedConstraints.forbidden_ingredients || [],
            required_temperature: parsedConstraints.required_temperature || [],
            preferred_tags: parsedConstraints.preferred_tags || [],
            max_price: parsedConstraints.max_price || undefined
        };

        console.log('🛡️ [Edge] 最终发送云端的脱敏 Payload:', constraints);

        // 3. 将脱敏 Payload 发送给云端 Agent 决策
        const response = await recommendationService.getEdgeSynergyRecommendations({
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            query: safeQuery.trim(),
            constraints: constraints,
            weatherContext: weatherContext
        });

        // 4. 处理容错与降级反馈
        if (response.isFallbackNeeded || response.status === 'NO_MATCH') {
            return {
                success: true,
                isFallbackNeeded: true,
                message: response.message || '周边暂无严格符合您健康约束的餐品'
            };
        }

        return {
            success: true,
            isFallbackNeeded: false,
            data: response
        };
    }
}

export const edgeSynergyService = new EdgeSynergyEngine();