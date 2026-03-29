// src/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICE_URLS, API_CONFIG } from '../config/serviceConfig';
import { cacheService } from '../utils/cacheUtils';

// 是否开启调试日志（生产环境应关闭）
const DEBUG_MODE = __DEV__;

// 请求去重：防止同一请求短时间内重复发送
const pendingRequests = new Map();

// 生成请求唯一标识
const getRequestKey = (url, method, data) => {
    return `${method}_${url}_${JSON.stringify(data || {})}`;
};

// 添加 axios 请求拦截器（仅在开发模式输出日志）
axios.interceptors.request.use(request => {
    if (DEBUG_MODE) {
        console.log('[API] 发送请求:', request.method?.toUpperCase(), request.url);
    }
    return request;
}, error => {
    console.error('[API] 请求拦截器错误:', error);
    return Promise.reject(error);
});

// 添加 axios 响应拦截器
axios.interceptors.response.use(response => {
    if (DEBUG_MODE) {
        console.log('[API] 响应:', response.status, response.config.url);
    }
    return response;
}, error => {
    if (DEBUG_MODE) {
        console.error('[API] 错误:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
});

// 1. 获取 Token 的异步方法 (注意：App里读取存储是异步的)
export const getToken = async () => {
    try {
        return await AsyncStorage.getItem('token');
    } catch (e) {
        console.error('获取Token失败', e);
        return null;
    }
};

// 缓存类型映射：根据 urlKey 确定缓存类型
const CACHE_TYPE_MAP = {
    merchants: 'merchants',
    recommendation: 'recommendations',
    orders: 'orders',
    users: 'user',
};

// 可缓存的 GET 请求端点模式
const CACHEABLE_PATTERNS = [
    { service: 'merchants', pattern: /^\/$/, type: 'merchants' },
    { service: 'merchants', pattern: /^\/\d+$/, type: 'merchants' },
    { service: 'merchants', pattern: /\/menu-items/, type: 'menu' },
    { service: 'recommendation', pattern: /\/recommendations/, type: 'recommendations' },
];

// 判断请求是否可缓存
const isCacheable = (urlKey, endpoint, method) => {
    if (method !== 'GET') return false;
    return CACHEABLE_PATTERNS.some(
        p => p.service === urlKey && p.pattern.test(endpoint)
    );
};

// 获取缓存类型
const getCacheType = (urlKey, endpoint) => {
    const match = CACHEABLE_PATTERNS.find(
        p => p.service === urlKey && p.pattern.test(endpoint)
    );
    return match?.type || CACHE_TYPE_MAP[urlKey] || 'default';
};

// 2. 通用请求函数
// urlKey: 对应 SERVICE_URLS 中的 key，例如 'auth', 'orders'
// endpoint: 具体路径，例如 '/login'
// options.useCache: 是否使用缓存（默认 true）
// options.forceRefresh: 强制刷新缓存
export const request = async (urlKey, endpoint, options = {}) => {
    const baseUrl = SERVICE_URLS[urlKey];
    if (!baseUrl) {
        throw new Error(`未找到服务配置: ${urlKey}`);
    }

    // 拼接完整 URL，例如 http://192.168.1.16:8083/api/auth/login
    const fullUrl = `${baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    // 缓存逻辑（仅对 GET 请求）
    const useCache = options.useCache !== false;
    const forceRefresh = options.forceRefresh === true;
    const canCache = isCacheable(urlKey, endpoint, method);

    if (canCache && useCache && !forceRefresh) {
        const cacheType = getCacheType(urlKey, endpoint);
        const cached = await cacheService.get(cacheType, { urlKey, endpoint });
        if (cached) {
            return cached;
        }
    }

    // 请求去重：防止同一请求短时间内重复发送
    const requestKey = getRequestKey(fullUrl, method, options.body);
    if (pendingRequests.has(requestKey)) {
        if (DEBUG_MODE) {
            console.log('[API] 请求合并:', requestKey);
        }
        return pendingRequests.get(requestKey);
    }

    // 获取 Token
    const token = await getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 对于登录/注册等认证接口，不发送旧的 token (避免过期 token 导致 500 错误)
    const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/login') || endpoint.includes('/register');
    if (token && !isAuthEndpoint) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        url: fullUrl,
        method: method,
        headers: headers,
        data: options.body, // axios 用 data，fetch 用 body
        timeout: API_CONFIG.TIMEOUT || 15000, // 使用配置的超时时间
    };

    // 创建请求 Promise 并存入去重 Map
    const requestPromise = (async () => {
        try {
            const response = await axios(config);
            const data = response.data;

            // 缓存成功的 GET 响应
            if (canCache && useCache) {
                const cacheType = getCacheType(urlKey, endpoint);
                await cacheService.set(cacheType, { urlKey, endpoint }, data);
            }

            return data;
        } catch (error) {
            // 错误处理
            if (error.response) {
                // 后端返回了错误状态码 (4xx, 5xx)
                const status = error.response.status;
                if (DEBUG_MODE) {
                    console.error(`[API] Error Response:`, status, config.url);
                }

                if (status === 401) {
                    // Token 过期或未登录
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    throw new Error('UNAUTHORIZED');
                }

                if (status === 403) {
                    const currentToken = await AsyncStorage.getItem('token');
                    if (!currentToken) {
                        throw new Error('未登录，请先登录');
                    } else {
                        throw new Error('登录验证失败(403)');
                    }
                }

                // 尝试提取后端返回的错误文字
                const errorMsg = error.response.data?.message || error.response.data || `请求失败 (${status})`;
                throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
            } else if (error.request) {
                throw new Error('网络连接失败，请检查后端服务是否启动');
            } else {
                throw new Error(error.message);
            }
        } finally {
            // 请求完成后移除去重记录
            pendingRequests.delete(requestKey);
        }
    })();

    // 存入去重 Map
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
};

// 导出便捷方法
export default {
    get: (service, endpoint, options = {}) => request(service, endpoint, { method: 'GET', ...options }),
    post: (service, endpoint, data, options = {}) => request(service, endpoint, { method: 'POST', body: data, ...options }),
    put: (service, endpoint, data, options = {}) => request(service, endpoint, { method: 'PUT', body: data, ...options }),
    del: (service, endpoint, options = {}) => request(service, endpoint, { method: 'DELETE', ...options }),
    patch: (service, endpoint, data, options = {}) => request(service, endpoint, { method: 'PATCH', body: data, ...options }),
    // 清除缓存方法
    clearCache: (type) => cacheService.clear(type),
    clearAllCache: () => cacheService.clearAll(),
};