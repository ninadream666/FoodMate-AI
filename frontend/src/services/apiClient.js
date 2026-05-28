// src/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICE_URLS, API_CONFIG } from '../config/serviceConfig';
import { cacheService } from '../utils/cacheUtils';

// 是否开启调试日志（生产环境应关闭）
const DEBUG_MODE = __DEV__;

// ============ 分级超时配置 ============
// 不同服务类型使用不同的超时时间，避免图片上传被过短超时截断
const SERVICE_TIMEOUT = {
    nutrivision: 120000,   // 图片分析：120s（含上传+AI推理）
    recommendation: 60000, // 推荐服务：60s（含高德POI + 和风天气 + 路况 + DeepSeek LLM推荐语）
    default: API_CONFIG.TIMEOUT || 15000,
};

const getServiceTimeout = (urlKey) => {
    return SERVICE_TIMEOUT[urlKey] || SERVICE_TIMEOUT.default;
};

// ============ 请求去重 ============
const pendingRequests = new Map();

const getRequestKey = (url, method, data) => {
    return `${method}_${url}_${JSON.stringify(data || {})}`;
};

// ============ 请求取消管理 ============
// 维护活跃的 AbortController，支持页面卸载时取消未完成的请求
const activeControllers = new Map();

/**
 * 取消指定服务的所有进行中请求
 * 典型场景：用户快速返回上一页，取消尚未完成的图片分析请求
 */
export const cancelServiceRequests = (urlKey) => {
    for (const [key, controller] of activeControllers.entries()) {
        if (key.includes(urlKey)) {
            controller.abort();
            activeControllers.delete(key);
            if (DEBUG_MODE) console.log(`[API] 已取消请求: ${key}`);
        }
    }
};

/**
 * 取消所有进行中的请求
 */
export const cancelAllRequests = () => {
    for (const [key, controller] of activeControllers.entries()) {
        controller.abort();
    }
    activeControllers.clear();
};

// ============ 指数退避重试 ============
const MAX_RETRIES = API_CONFIG.MAX_RETRIES || 2;

// 可重试的HTTP状态码（服务端临时故障）
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// 不应重试的请求方法（非幂等操作）
const NON_RETRYABLE_METHODS = new Set(['POST', 'PATCH']);

const shouldRetry = (error, method) => {
    // 非幂等请求默认不重试（避免重复下单等问题）
    if (NON_RETRYABLE_METHODS.has(method.toUpperCase())) return false;
    // 请求被主动取消，不重试
    if (axios.isCancel(error)) return false;
    // 网络错误（无响应）可重试
    if (!error.response) return true;
    // 特定状态码可重试
    return RETRYABLE_STATUS_CODES.has(error.response.status);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============ Axios拦截器 ============
axios.interceptors.request.use(request => {
    if (DEBUG_MODE) {
        console.log('[API] 发送请求:', request.method?.toUpperCase(), request.url);
    }
    return request;
}, error => {
    console.error('[API] 请求拦截器错误:', error);
    return Promise.reject(error);
});

axios.interceptors.response.use(response => {
    if (DEBUG_MODE) {
        const size = JSON.stringify(response.data).length;
        const sizeKB = (size / 1024).toFixed(1);
        console.log(`[API] 响应: ${response.status} ${response.config.url} (${sizeKB}KB)`);
    }
    return response;
}, error => {
    if (DEBUG_MODE && !axios.isCancel(error)) {
        console.error('[API] 错误:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
});

// ============ Token ============
export const getToken = async () => {
    try {
        return await AsyncStorage.getItem('token');
    } catch (e) {
        console.error('获取Token失败', e);
        return null;
    }
};

// ============ 缓存配置 ============
const CACHE_TYPE_MAP = {
    merchants: 'merchants',
    recommendation: 'recommendations',
    orders: 'orders',
    users: 'user',
};

const CACHEABLE_PATTERNS = [
    { service: 'merchants', pattern: /^\/$/, type: 'merchants' },
    { service: 'merchants', pattern: /^\/\d+$/, type: 'merchants' },
    { service: 'merchants', pattern: /\/menu-items/, type: 'menu' },
    { service: 'recommendation', pattern: /\/recommendations/, type: 'recommendations' },
];

const isCacheable = (urlKey, endpoint, method) => {
    if (method !== 'GET') return false;
    return CACHEABLE_PATTERNS.some(
        p => p.service === urlKey && p.pattern.test(endpoint)
    );
};

const getCacheType = (urlKey, endpoint) => {
    const match = CACHEABLE_PATTERNS.find(
        p => p.service === urlKey && p.pattern.test(endpoint)
    );
    return match?.type || CACHE_TYPE_MAP[urlKey] || 'default';
};

// ============ 核心请求函数 ============
export const request = async (urlKey, endpoint, options = {}) => {
    const baseUrl = SERVICE_URLS[urlKey];
    if (!baseUrl) {
        throw new Error(`未找到服务配置: ${urlKey}`);
    }

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

    // 请求去重
    const requestKey = getRequestKey(fullUrl, method, options.body);
    if (pendingRequests.has(requestKey)) {
        if (DEBUG_MODE) console.log('[API] 请求合并:', requestKey);
        return pendingRequests.get(requestKey);
    }

    const token = await getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/login') || endpoint.includes('/register');
    if (token && !isAuthEndpoint) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 创建 AbortController 用于请求取消
    const controller = new AbortController();
    const controllerKey = `${urlKey}_${endpoint}_${Date.now()}`;
    activeControllers.set(controllerKey, controller);

    // 使用分级超时：不同服务不同超时
    const timeout = options.timeout || getServiceTimeout(urlKey);

    const config = {
        url: fullUrl,
        method: method,
        headers: headers,
        data: options.body,
        timeout: timeout,
        signal: controller.signal,
        // 大响应体自动解压，axios默认支持
        decompress: true,
    };

    // 带重试的请求执行
    const requestPromise = (async () => {
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    // 指数退避：1s, 2s, 4s...
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
                    if (DEBUG_MODE) console.log(`[API] 第${attempt}次重试，等待 ${backoffMs}ms`);
                    await sleep(backoffMs);
                }

                const response = await axios(config);
                let data = response.data;

                // 兜底：如果响应是字符串（chunked 未解码等），尝试手动解析
                if (typeof data === 'string') {
                    try {
                        // 去除 chunked transfer encoding 的长度前缀（如 "842\r\n{...}\r\n0\r\n\r\n"）
                        const cleaned = data.replace(/^\s*[0-9a-fA-F]+\r\n/, '').replace(/\r\n0\r\n\r\n\s*$/, '').trim();
                        data = JSON.parse(cleaned);
                    } catch (parseErr) {
                        if (DEBUG_MODE) console.warn('[API] 响应字符串解析失败:', parseErr);
                    }
                }

                // 缓存成功的GET响应
                if (canCache && useCache) {
                    const cacheType = getCacheType(urlKey, endpoint);
                    await cacheService.set(cacheType, { urlKey, endpoint }, data);
                }

                return data;
            } catch (error) {
                lastError = error;

                // 被主动取消的请求直接抛出，不重试
                if (axios.isCancel(error)) {
                    throw new Error('请求已取消');
                }

                // 判断是否应该重试
                if (attempt < MAX_RETRIES && shouldRetry(error, method)) {
                    continue;
                }

                // 不再重试，抛出错误
                break;
            }
        }

        // 错误处理
        const error = lastError;
        if (error.response) {
            const status = error.response.status;
            if (DEBUG_MODE) {
                console.error(`[API] Error Response:`, status, config.url);
            }

            if (status === 401) {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                throw new Error('UNAUTHORIZED');
            }

            if (status === 403) {
                const forbiddenMsg = error.response.data?.message || error.response.data || '权限不足(403)';
                throw new Error(typeof forbiddenMsg === 'string' ? forbiddenMsg : `请求被拒绝 (403)`);
            }

            if (status === 409) {
                const conflictMsg = error.response.data?.message || error.response.data || '操作冲突';
                throw new Error(typeof conflictMsg === 'string' ? conflictMsg : JSON.stringify(conflictMsg));
            }

            if (status === 429) {
                throw new Error('请求过于频繁，请稍后再试');
            }

            const errorMsg = error.response.data?.message || error.response.data || `请求失败 (${status})`;
            throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } else if (error.request) {
            throw new Error('网络连接失败，请检查网络设置');
        } else {
            throw new Error(error.message);
        }
    })().finally(() => {
        pendingRequests.delete(requestKey);
        activeControllers.delete(controllerKey);
    });

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
    // 缓存管理
    clearCache: (type) => cacheService.clear(type),
    clearAllCache: () => cacheService.clearAll(),
    // 请求取消
    cancelServiceRequests,
    cancelAllRequests,
};
