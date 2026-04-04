// src/services/recommendationService.js
import api from './apiClient';
import { merchantService } from './merchantService';

// 模拟数据
const MOCK_RECOMMENDATIONS = {
    restaurants: [
        { id: 1, name: '川味观', image: 'https://loremflickr.com/400/300/chinese,food', rating: 4.8, deliveryTime: '30-40分钟', tags: ['川菜', '辣味'] },
        { id: 2, name: '寿司之家', image: 'https://loremflickr.com/400/300/sushi,japanese', rating: 4.6, deliveryTime: '25-35分钟', tags: ['日料', '寿司'] },
    ],
    total_count: 2,
};

export const recommendationService = {
    // 获取智能推荐
    getV2Recommendations: async (params = {}) => {
        try {
            const body = {
                user_id: String(params.userId || '1'),
                location: {
                    address: params.address || '当前位置',
                    latitude: params.latitude || 0,
                    longitude: params.longitude || 0,
                },
                query: params.query || '为我推荐附近的美食',
                max_results: Number(params.maxResults) || 10,
            };

            // 添加健康上下文
            if (params.healthContext) {
                const hc = params.healthContext;
                body.health_context = {
                    daily_steps: hc.dailySteps ?? hc.daily_steps ?? 0,
                    recent_steps_30min: hc.recentSteps30min ?? hc.recent_steps_30min ?? 0,
                    heart_rate: hc.heartRate ?? hc.heart_rate ?? 75,
                    activity_status: hc.activityStatus ?? hc.activity_status ?? 'still',
                    is_post_workout: hc.isPostWorkout ?? hc.is_post_workout ?? false,
                };
            }

            // 添加天气上下文
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
            }

            // 添加忌口/过敏原
            if (params.allergies && params.allergies.length > 0) {
                body.allergies = params.allergies;
            }

            if (__DEV__) console.log('🚀 调用智能推荐 API');

            const data = await api.post('recommendation', '/agents/recommend', body);

            if (__DEV__) console.log('✅ 推荐响应:', (data.recommendations || data.restaurants || []).length, '条');

            // 自动导入逻辑：异步，不阻塞返回
            const list = data.recommendations || data.restaurants || [];
            if (list.length > 0 && merchantService.importRealRestaurant) {
                importAgentRestaurants(list);
            }

            return data;
        } catch (error) {
            console.warn('推荐服务不可用，使用兜底数据:', error.message);
            return MOCK_RECOMMENDATIONS;
        }
    },

    // 获取工作流说明（可选）
    getWorkflowExplanation: async () => {
        try {
            return await api.get('recommendation', '/agents/explain');
        } catch (e) {
            return null;
        }
    },

    // 获取端云协同智能推荐
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

// 辅助：导入餐厅数据（并行执行，不逐个等待）
const importAgentRestaurants = async (restaurants) => {
    try {
        const validItems = restaurants.filter(r => r.id && typeof r.id === 'string' && r.id.length > 5);
        // 并行导入所有餐厅，每个独立catch防止单个失败影响其他
        await Promise.all(
            validItems.map(r =>
                merchantService.importRealRestaurant({
                    externalId: r.id,
                    name: r.name,
                    address: r.address,
                    imageUrl: r.image,
                }).catch(() => {})
            )
        );
    } catch (e) {
        // 静默失败，不影响主流程
    }
};