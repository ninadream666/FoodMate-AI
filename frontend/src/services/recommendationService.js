// src/services/recommendationService.js
import api from './apiClient';
import { merchantService } from './merchantService';

// 模拟数据 (兜底用)
const MOCK_RECOMMENDATIONS = {
    restaurants: [
        { id: 1, name: '川味观', image: 'https://loremflickr.com/400/300/chinese,food', rating: 4.8, deliveryTime: '30-40分钟', tags: ['川菜', '辣味'] },
        { id: 2, name: '寿司之家', image: 'https://loremflickr.com/400/300/sushi,japanese', rating: 4.6, deliveryTime: '25-35分钟', tags: ['日料', '寿司'] },
    ],
    total_count: 2,
};

export const recommendationService = {
    // 1. 获取智能推荐 (V2)
    getV2Recommendations: async (params = {}) => {
        try {
            // 构造请求体 - 保持完整精度
            const body = {
                user_id: String(params.userId || '1'),
                location: {
                    address: params.address || '当前位置',
                    latitude: params.latitude || 0, // 保持原始精度，不强制转换
                    longitude: params.longitude || 0,
                },
                query: params.query || '为我推荐附近的美食',
                max_results: Number(params.maxResults) || 10,
            };

            // 添加健康上下文（如果提供）
            if (params.healthContext) {
                body.health_context = {
                    daily_steps: params.healthContext.dailySteps || 0,
                    recent_steps_30min: params.healthContext.recentSteps30min || 0,
                    heart_rate: params.healthContext.heartRate || 75,
                    activity_status: params.healthContext.activityStatus || 'still',
                    is_post_workout: params.healthContext.isPostWorkout || false,
                };
                console.log('🏃 携带健康上下文:', body.health_context);
            }

            // 添加天气上下文（如果提供）
            if (params.weatherContext) {
                body.weather_context = {
                    condition: params.weatherContext.condition || '晴',
                    temperature: params.weatherContext.temperature || 25,
                    humidity: params.weatherContext.humidity || 50,
                    wind_speed: params.weatherContext.windSpeed || 10,
                    is_raining: params.weatherContext.isRaining || false,
                    is_heavy_rain: params.weatherContext.isHeavyRain || false,
                    delivery_impact: params.weatherContext.deliveryImpact || 'none',
                };
                console.log('🌦️ 携带天气上下文:', body.weather_context);
            }

            console.log('🔍 调用智能推荐 - 详细参数:', JSON.stringify(body, null, 2));
            console.log('🌐 即将发送API请求到 recommendation/agents/recommend');

            // 检查位置是否为默认北京位置
            if (Math.abs(body.location.latitude - 39.9042) < 0.001 && Math.abs(body.location.longitude - 116.4074) < 0.001) {
                console.warn('⚠️ 推荐服务警告：检测到北京默认位置，这可能不是用户真实位置');
            }

            // 注意：这里手动指定 /v2 前缀，因为 apiClient 默认可能是 /api
            // 如果 apiClient 配置的是 baseURL/api，这里需要根据实际情况调整
            // 假设 apiClient.post 会拼接在 baseURL 后
            // 我们这里尝试直接请求 'agents', '/recommend' (假设 backend 路由结构)
            // 如果后端是 microservices，可能需要调整 path
            console.log('⏰ 开始API调用...');
            const data = await api.post('recommendation', '/agents/recommend', body);
            console.log('✅ API调用成功，收到响应:', data);

            // 自动导入逻辑 (如果 merchantService 支持)
            const list = data.recommendations || data.restaurants || [];
            if (list.length > 0 && merchantService.importRealRestaurant) {
                // 异步导入，不阻塞 UI
                importAgentRestaurants(list);
            }

            return data;
        } catch (error) {
            console.error('❌ 智能推荐服务调用失败:', error);
            console.error('❌ 错误详情:', error.message);
            console.error('❌ 错误栈:', error.stack);
            console.warn('🔄 智能推荐服务不可用，使用模拟数据');
            return MOCK_RECOMMENDATIONS;
        }
    },

    // 2. 获取工作流说明 (可选)
    getWorkflowExplanation: async () => {
        try {
            return await api.get('recommendation', '/agents/explain');
        } catch (e) {
            return null;
        }
    },

    // 3. 🛡️ 获取端云协同智能推荐 (隐私保护版)
    getEdgeSynergyRecommendations: async (params = {}) => {
        try {
            const body = {
                location: {
                    address: params.address || '当前位置',
                    latitude: params.latitude || 0,
                    longitude: params.longitude || 0,
                },
                query: params.query || '',
                constraints: params.constraints || {
                    forbidden_ingredients: [],
                    required_temperature: []
                },
                max_results: Number(params.maxResults) || 10,
                weather_context: params.weatherContext || null
            };

            console.log('🛡️ [Edge Synergy] 向云端发送脱敏约束请求:', JSON.stringify(body, null, 2));
            const data = await api.post('recommendation', '/agents/edge-synergy-recommend', body);
            
            // 处理云端传回的降级状态
            if (data.status === 'NO_MATCH') {
                console.log('🛡️ [Edge Synergy] 云端返回 NO_MATCH，未找到严格符合健康约束的餐品，需要触发降级');
                return { ...data, isFallbackNeeded: true };
            }

            // 自动导入逻辑
            const list = data.recommendations || data.restaurants || [];
            if (list.length > 0 && merchantService.importRealRestaurant) {
                importAgentRestaurants(list);
            }

            return { ...data, isFallbackNeeded: false };
        } catch (error) {
            console.error('❌ 端云协同服务调用失败:', error);
            // 请求失败时，也触发降级，让首页回到默认推荐
            return { success: false, isFallbackNeeded: true, message: error.message };
        }
    }
};

// 辅助：导入餐厅数据
const importAgentRestaurants = async (restaurants) => {
    try {
        const validItems = restaurants.filter(r => r.id && typeof r.id === 'string' && r.id.length > 5);
        for (const r of validItems) {
            await merchantService.importRealRestaurant({
                externalId: r.id,
                name: r.name,
                address: r.address,
                imageUrl: r.image,
                // ...其他字段映射
            }).catch(() => { });
        }
    } catch (e) {
        console.warn('导入餐厅辅助任务失败', e);
    }
};