/**
 * 统一 API 客户端
 * 基于 API 文档配置，管理所有后端服务的请求
 */

// API 基础路径配置（通过 vite 代理转发）
export const API_BASE = {
    auth: '/api/auth',           // 认证服务 -> user-service:8083
    users: '/api/users',         // 用户服务 -> user-service:8083
    merchants: '/api/merchants', // 商家服务 -> merchant-service:8081
    orders: '/api/orders',       // 订单服务 -> order-service:8084
    coupons: '/api/coupons',     // 优惠券服务 -> marketing-service:8082
    marketing: '/api/marketing', // 营销服务 -> marketing-service:8082
    profile: '/api/profile',     // 用户画像 -> profile-service:8086
    recommendation: '/api/v2',   // 推荐服务 -> recommendation-service:8087
    platform: '/api/admin',      // 平台服务 -> platform-service:8088
};

/**
 * 获取认证 Token
 */
export const getToken = () => localStorage.getItem('token');

/**
 * 获取认证请求头
 */
export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 检查用户是否已登录
 */
export const isAuthenticated = () => !!getToken();

/**
 * 统一请求方法
 * @param {string} url - 请求 URL
 * @param {object} options - 请求选项
 * @returns {Promise<any>} - 响应数据
 */
export const request = async (url, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        // 处理 401 未认证错误
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 如果不在登录页，跳转到登录
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            throw new Error('未认证，请重新登录');
        }

        // 处理其他错误
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status}`;
            try {
                const errorData = await response.text();
                if (errorData) {
                    errorMessage = errorData;
                }
            } catch (e) {
                // 忽略解析错误
            }
            throw new Error(errorMessage);
        }

        // 尝试解析 JSON，如果失败返回文本
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error('API 请求错误:', error);
        throw error;
    }
};

/**
 * GET 请求
 */
export const get = (url, options = {}) => request(url, { ...options, method: 'GET' });

/**
 * POST 请求
 */
export const post = (url, data, options = {}) =>
    request(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    });

/**
 * PUT 请求
 */
export const put = (url, data, options = {}) =>
    request(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    });

/**
 * DELETE 请求
 */
export const del = (url, options = {}) => request(url, { ...options, method: 'DELETE' });

/**
 * PATCH 请求
 */
export const patch = (url, data, options = {}) =>
    request(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

export default {
    API_BASE,
    getToken,
    getAuthHeaders,
    isAuthenticated,
    request,
    get,
    post,
    put,
    del,
    patch,
};
