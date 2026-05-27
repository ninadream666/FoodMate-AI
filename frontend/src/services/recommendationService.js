import api from './apiClient';
import { merchantService } from './merchantService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'last_recommendations';
const CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存有效期

const saveRecommendationCache = async (data) => {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    } catch (e) { /* 缓存写入失败不影响主流程 */ }
};

const getRecommendationCache = async () => {
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp > CACHE_TTL) return null; // 过期
        return data;
    } catch (e) { return null; }
};

const getFallbackRecommendations = async () => {
    // 1. 尝试用上次缓存的推荐结果
    const cached = await getRecommendationCache();
    if (cached) {
        const list = cached.recommendations || cached.restaurants || [];
        if (list.length > 0) {
            console.log('📦 使用缓存的推荐数据兜底:', list.length, '条');
            return { ...cached, is_fallback: true, is_cached: true };
        }
    }

    // 2. 从商户服务获取真实商户列表
    try {
        const merchants = await merchantService.getRecommendedMerchants();
        if (merchants && merchants.length > 0) {
            return { restaurants: merchants, total_count: merchants.length, is_fallback: true };
        }
    } catch (e) {
        console.warn('兜底商户列表也获取失败:', e.message);
    }

    // 3. 最终兜底：返回空列表
    return { restaurants: [], total_count: 0, is_fallback: true };
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

            // 添加健康上下文（透传全部字段给后端 DecisionAgent）
            if (params.healthContext) {
                const hc = params.healthContext;
                body.health_context = {
                    daily_steps: hc.daily_steps ?? hc.dailySteps ?? 0,
                    recent_steps_30min: hc.recent_steps_30min ?? hc.recentSteps30min ?? 0,
                    daily_distance: hc.daily_distance ?? hc.dailyDistance ?? 0,
                    daily_calories: hc.daily_calories ?? hc.dailyCalories ?? 0,
                    heart_rate: hc.heart_rate ?? hc.heartRate ?? 75,
                    resting_heart_rate: hc.resting_heart_rate ?? hc.restingHeartRate ?? 65,
                    avg_heart_rate: hc.avg_heart_rate ?? hc.avgHeartRate ?? 75,
                    max_heart_rate: hc.max_heart_rate ?? hc.maxHeartRate ?? 0,
                    min_heart_rate: hc.min_heart_rate ?? hc.minHeartRate ?? 0,
                    activity_status: hc.activity_status ?? hc.activityStatus ?? 'still',
                    is_post_workout: hc.is_post_workout ?? hc.isPostWorkout ?? false,
                    recent_workout_duration: hc.recent_workout_duration ?? hc.recentWorkoutDuration ?? 0,
                    recent_workout_calories: hc.recent_workout_calories ?? hc.recentWorkoutCalories ?? 0,
                    recent_workout_type: hc.recent_workout_type ?? hc.recentWorkoutType ?? '',
                    pressure_value: hc.pressure_value ?? hc.pressureValue ?? 50,
                    avg_pressure: hc.avg_pressure ?? hc.avgPressure ?? 50,
                    pressure_level: hc.pressure_level ?? hc.pressureLevel ?? '正常',
                    last_sleep_duration: hc.last_sleep_duration ?? hc.lastSleepDuration ?? 0,
                    last_sleep_duration_hours: hc.last_sleep_duration_hours ?? hc.lastSleepDurationHours ?? 0,
                    last_sleep_score: hc.last_sleep_score ?? hc.lastSleepScore ?? 0,
                    sleep_quality: hc.sleep_quality ?? hc.sleepQuality ?? '无数据',
                    last_deep_sleep_duration: hc.last_deep_sleep_duration ?? hc.lastDeepSleepDuration ?? 0,
                    last_light_sleep_duration: hc.last_light_sleep_duration ?? hc.lastLightSleepDuration ?? 0,
                    last_rem_sleep_duration: hc.last_rem_sleep_duration ?? hc.lastRemSleepDuration ?? 0,
                    blood_oxygen: hc.blood_oxygen ?? hc.bloodOxygen ?? 98,
                    avg_blood_oxygen: hc.avg_blood_oxygen ?? hc.avgBloodOxygen ?? 98,
                    blood_oxygen_status: hc.blood_oxygen_status ?? hc.bloodOxygenStatus ?? '正常',
                    today_relax_duration: hc.today_relax_duration ?? hc.todayRelaxDuration ?? 0,
                    light_lux: hc.light_lux ?? hc.lightLux ?? 300,
                    light_level: hc.light_level ?? hc.lightLevel ?? 'normal',
                    overall_health_status: hc.overall_health_status ?? hc.overallHealthStatus ?? '无数据',
                    activity_level: hc.activity_level ?? hc.activityLevel ?? '无数据',
                    needs_rest: hc.needs_rest ?? hc.needsRest ?? false,
                    is_well_rested: hc.is_well_rested ?? hc.isWellRested ?? false,
                    has_wearable_device: hc.has_wearable_device ?? hc.hasWearableDevice ?? false,
                    device_type: hc.device_type ?? hc.deviceType ?? '',
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

            // 推荐成功时持久化缓存，下次超时可立即展示
            if (list.length > 0) {
                saveRecommendationCache(data);
            }

            return data;
        } catch (error) {
            console.warn('推荐服务不可用，使用商户列表兜底:', error.message);
            return await getFallbackRecommendations();
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
                }).catch(() => { })
            )
        );
    } catch (e) {
        // 静默失败，不影响主流程
    }
};