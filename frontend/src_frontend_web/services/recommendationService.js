// 推荐服务 API

import { merchantService } from './merchantService';

const API_BASE = '/api/v1';
const API_V2_BASE = '/api/v2';

// 模拟数据 - 当后端不可用时使用
const MOCK_RECOMMENDATIONS = {
    success: true,
    data: {
        restaurants: [
            {
                id: 1,
                name: '川味观',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhbQ9QcRMxm3Llr59SYyPVDBvXIeETgPqmZ_TDh0yGFWfgYmjwN89xAIT2MGtR--XXTFjIlci4ywk8FxQXju58r-0x4abnohjNJ0yvHytPSCMeME8hpWfe-iuarjXSMaMtmaToplyJCQzWEJ1PC_FrV_i0Rf2WcM57dchzX78SC-fPZrifDw9SYP2b73FdLAcxRrqgO0nkOXsdaMMvXb85jDZ2Lm68VN2jDGHZCeeS4N-judX4sb3iiv0fUZqmCc0iOZlIFSo2K0Bx',
                rating: 4.8,
                deliveryTime: '30-40分钟',
                deliveryFee: 5,
                tags: ['川菜', '辣味', '热门'],
                description: '正宗川菜，麻辣鲜香',
            },
            {
                id: 2,
                name: '寿司之家',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmmd-i4u5v21dh8Ip1PqQdmDDbIYxNeb8OpD0iwmy60G1vNZ9xxIxPJqyAP7kCV8jzvrSQD8zQuLrRvI_-R1CCMGm0tGeRbvLANxmBxvzpAN8sG8zR8kyBH4UdgaP-37WBj-k0Soe7jH3a2ERUM7qsHnkxbPV2UynBCU8ppX0BaGm93gPtVDmAil-sCuYyFxRWiSmcuit_tWPlIA8C_O7TctaQxlMVWKYdQ7xHhFFZplnBVJ2kCwJ0pr2Rm9VquCzWpE7qLdbczkm4',
                rating: 4.6,
                deliveryTime: '25-35分钟',
                deliveryFee: 3,
                tags: ['日料', '寿司', '刺身'],
                description: '新鲜食材，匠心制作',
            },
            {
                id: 3,
                name: '意式小馆',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCMN7b4zYVFSVM8i5TWgyWcKYuiJbENG81R8eugOUr74m1XVp2aodGdJ1SmveJM9Ow5jbCxnVkApGd33OSisQrq_WWQlQr0TrZYsE5C34UoRCILMF6B_trsPF5AUeKStWQ6oRYa6Fyr7hA_czV1W29_8PCQySdBWqSw5UGd5AjV_RzEe9PgNr1cEIhjX3T4pOkRN57Bj__sCQMOH_WClvYnsXqNIuYPE2nk_sDZVU_fwgGX5Uy0bIws8_Zpdb5rMznM0107khtiKVk',
                rating: 4.7,
                deliveryTime: '35-45分钟',
                deliveryFee: 6,
                tags: ['意大利菜', '披萨', '意面'],
                description: '地道意式风味',
            },
            {
                id: 4,
                name: '粤式茶餐厅',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23',
                rating: 4.5,
                deliveryTime: '20-30分钟',
                deliveryFee: 4,
                tags: ['粤菜', '早茶', '点心'],
                description: '经典粤式点心',
            },
            {
                id: 5,
                name: '东北饺子馆',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhbQ9QcRMxm3Llr59SYyPVDBvXIeETgPqmZ_TDh0yGFWfgYmjwN89xAIT2MGtR--XXTFjIlci4ywk8FxQXju58r-0x4abnohjNJ0yvHytPSCMeME8hpWfe-iuarjXSMaMtmaToplyJCQzWEJ1PC_FrV_i0Rf2WcM57dchzX78SC-fPZrifDw9SYP2b73FdLAcxRrqgO0nkOXsdaMMvXb85jDZ2Lm68VN2jDGHZCeeS4N-judX4sb3iiv0fUZqmCc0iOZlIFSo2K0Bx',
                rating: 4.4,
                deliveryTime: '25-35分钟',
                deliveryFee: 3,
                tags: ['东北菜', '饺子', '面食'],
                description: '手工现包饺子',
            },
        ],
        banners: [
            { id: 1, image: 'https://via.placeholder.com/800x300/ee8c2b/ffffff?text=新用户立减20元', link: '/promo/new-user' },
            { id: 2, image: 'https://via.placeholder.com/800x300/ff6b6b/ffffff?text=限时优惠', link: '/promo/flash-sale' },
        ],
    },
};

// 获取 token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 获取主页推荐 (V2版本 - 智能推荐)
 * POST /api/v2/agents/recommend
 */
export const getHomepageRecommendations = async (params = {}) => {
    try {
        const response = await fetch(`${API_V2_BASE}/agents/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({
                user_id: params.userId || localStorage.getItem('userId') || '1',
                location: {
                    address: params.address || '北京市朝阳区建国门外大街',
                    latitude: params.latitude || 39.9042,  // 默认北京坐标
                    longitude: params.longitude || 116.4074,
                },
                query: params.query || '为我推荐附近的美食',
                max_results: params.maxResults || params.limit || 10,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.warn('后端服务不可用，使用模拟数据:', error.message);
        // 返回模拟数据
        return MOCK_RECOMMENDATIONS;
    }
};

/**
 * 获取智能推荐 (V2版本 - 使用新的智能推荐接口)
 * POST /api/v2/agents/recommend
 */
export const getSmartRecommendations = async (params = {}) => {
    try {
        const response = await fetch(`${API_V2_BASE}/agents/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({
                user_id: params.userId || localStorage.getItem('userId') || '1',
                location: {
                    address: params.address || '北京市朝阳区建国门外大街',
                    latitude: params.latitude || 39.9042,
                    longitude: params.longitude || 116.4074,
                },
                query: params.query || '为我推荐附近的美食',
                max_results: params.maxResults || params.limit || 10,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.warn('智能推荐服务不可用，使用模拟数据:', error.message);
        // 返回模拟数据
        return MOCK_RECOMMENDATIONS;
    }
};

/**
 * 获取工作流说明
 * GET /api/v2/agents/explain
 */
export const getWorkflowExplanation = async () => {
    const response = await fetch(`${API_V2_BASE}/agents/explain`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

/**
 * V2 智能推荐接口 (主要推荐函数)
 * POST /api/v2/agents/recommend
 * @param {Object} params - 推荐参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.address - 用户地址
 * @param {number} params.latitude - 纬度
 * @param {number} params.longitude - 经度
 * @param {string} params.query - 推荐查询文本
 * @param {number} params.maxResults - 最大返回结果数
 */
export const getV2Recommendations = async (params = {}) => {
    try {
        const requestBody = {
            user_id: String(params.userId || localStorage.getItem('userId') || '1'),
            location: {
                address: params.address || '北京市朝阳区建国门外大街',
                latitude: Number(params.latitude) || 39.9042,
                longitude: Number(params.longitude) || 116.4074,
            },
            query: params.query || '为我推荐附近的美食',
            max_results: Number(params.maxResults) || 10,
        };

        console.log('🔍 智能推荐请求参数:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_V2_BASE}/agents/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            // 尝试获取错误详情
            const errorText = await response.text();
            console.error('❌ 智能推荐API错误响应:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}, detail: ${errorText}`);
        }

        const data = await response.json();

        // 如果智能体返回了真实餐厅数据，自动导入到数据库
        const restaurants = data.recommendations || data.restaurants || (Array.isArray(data) ? data : []);
        if (restaurants.length > 0) {
            await importAgentRestaurantsToDatabase(restaurants);
        }

        return data;
    } catch (error) {
        console.warn('V2智能推荐服务不可用，使用模拟数据:', error.message);
        // 返回模拟数据
        return MOCK_RECOMMENDATIONS;
    }
};

/**
 * 将智能体返回的餐厅数据导入数据库
 * 只导入有外部ID的真实餐厅数据
 */
const importAgentRestaurantsToDatabase = async (restaurants) => {
    const importPromises = restaurants
        .filter(r => r.id && typeof r.id === 'string' && r.id.length > 5) // 过滤出有外部ID的餐厅（字符串ID通常较长）
        .map(async (restaurant) => {
            try {
                const importData = {
                    externalId: restaurant.id || restaurant.external_id || restaurant.externalId,
                    name: restaurant.name || restaurant.restaurant_name,
                    address: restaurant.address || restaurant.location?.address || '',
                    latitude: restaurant.latitude || restaurant.location?.latitude,
                    longitude: restaurant.longitude || restaurant.location?.longitude,
                    imageUrl: restaurant.image || restaurant.image_url || restaurant.imageUrl,
                    rating: restaurant.rating || 4.5,
                    cuisineType: restaurant.cuisine_type || restaurant.cuisine || restaurant.tags?.[0],
                    phone: restaurant.tel || restaurant.phone,
                    description: restaurant.recommendation_reason || restaurant.description || restaurant.match_reasons?.[0] || '',
                };

                // 只有有外部ID时才导入
                if (importData.externalId && importData.name) {
                    console.log('自动导入餐厅到数据库:', importData.name, importData.externalId);
                    return await merchantService.importRealRestaurant(importData);
                }
            } catch (err) {
                console.warn('导入餐厅失败:', restaurant.name, err.message);
            }
            return null;
        });

    const results = await Promise.all(importPromises);
    const imported = results.filter(r => r !== null);
    if (imported.length > 0) {
        console.log(`成功导入 ${imported.length} 家餐厅到数据库`);
    }
};

// 辅助函数：获取当前时段
const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'dinner';
    return 'late_night';
};

/**
 * 服务健康检查
 * GET /health
 */
export const checkHealth = async () => {
    try {
        const response = await fetch('/api/v2/../health', {
            method: 'GET',
        });
        return response.ok;
    } catch (error) {
        console.warn('健康检查失败:', error.message);
        return false;
    }
};

/**
 * MCP系统状态
 * GET /api/v2/mcp/status
 */
export const getMcpStatus = async () => {
    try {
        const response = await fetch(`${API_V2_BASE}/mcp/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.warn('获取MCP状态失败:', error.message);
        return { status: 'unknown', error: error.message };
    }
};

export const recommendationService = {
    getHomepageRecommendations,
    getSmartRecommendations,
    getWorkflowExplanation,
    getV2Recommendations,
    checkHealth,
    getMcpStatus,
};
