// src/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICE_URLS, API_CONFIG } from '../config/serviceConfig';

// 添加 axios 请求拦截器来调试实际发送的请求
axios.interceptors.request.use(request => {
    console.log('[AXIOS INTERCEPTOR] 实际发送的请求:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    });
    return request;
}, error => {
    console.error('[AXIOS INTERCEPTOR] 请求拦截器错误:', error);
    return Promise.reject(error);
});

// 添加 axios 响应拦截器
axios.interceptors.response.use(response => {
    console.log('[AXIOS INTERCEPTOR] 收到响应:', response.status);
    return response;
}, error => {
    console.error('[AXIOS INTERCEPTOR] 响应拦截器 - 错误状态:', error.response?.status);
    console.error('[AXIOS INTERCEPTOR] 响应拦截器 - 错误数据:', error.response?.data);
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

// 2. 通用请求函数
// urlKey: 对应 SERVICE_URLS 中的 key，例如 'auth', 'orders'
// endpoint: 具体路径，例如 '/login'
export const request = async (urlKey, endpoint, options = {}) => {
    const baseUrl = SERVICE_URLS[urlKey];
    if (!baseUrl) {
        throw new Error(`未找到服务配置: ${urlKey}`);
    }

    // 拼接完整 URL，例如 http://192.168.1.16:8083/api/auth/login
    const fullUrl = `${baseUrl}${endpoint}`;

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
        method: options.method || 'GET',
        headers: headers,
        data: options.body, // axios 用 data，fetch 用 body
        timeout: API_CONFIG.TIMEOUT || 15000, // 使用配置的超时时间
    };

    try {
        console.log(`[API] Requesting: ${config.method} ${config.url}`);
        console.log(`[API] Headers:`, config.headers);
        console.log(`[API] Token exists:`, !!token);
        if (token) {
            console.log(`[API] Token format:`, token.substring(0, 20) + '...');
        }
        if (config.data) {
            console.log(`[API] Request body:`, JSON.stringify(config.data));
        }
        const response = await axios(config);
        return response.data;
    } catch (error) {
        // 错误处理
        if (error.response) {
            // 后端返回了错误状态码 (4xx, 5xx)
            const status = error.response.status;
            console.error(`[API] Error Response:`, {
                status: status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers,
                url: config.url
            });

            if (status === 401) {
                // Token 过期或未登录
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                // 注意：这里不能像Web那样直接 window.location 跳转
                // 我们抛出一个特定错误，让 UI 层去处理跳转
                throw new Error('UNAUTHORIZED');
            }

            if (status === 403) {
                // 权限不足或token无效
                console.error('[API] 403 Forbidden - URL:', config.url);
                console.error('[API] 403 Forbidden - Method:', config.method);
                console.error('[API] 403 Forbidden - ResponseData:', JSON.stringify(error.response.data));
                console.error('[API] 403 Forbidden - SentAuthHeader:', config.headers['Authorization']);

                // 检查是否有token
                const currentToken = await AsyncStorage.getItem('token');
                console.error('[API] 403 Token状态 - hasToken:', !!currentToken);
                console.error('[API] 403 Token状态 - tokenLength:', currentToken ? currentToken.length : 0);
                console.error('[API] 403 Token状态 - tokenPrefix:', currentToken ? currentToken.substring(0, 50) : 'null');

                let debugInfo = `hasToken=${!!currentToken}`;

                // 尝试解析token查看是否过期
                if (currentToken) {
                    try {
                        const parts = currentToken.split('.');
                        if (parts.length === 3) {
                            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                            while (base64.length % 4) base64 += '=';
                            const payload = JSON.parse(atob(base64));
                            const isExpired = Date.now() > payload.exp * 1000;
                            debugInfo += `, userId=${payload.userId}, role=${payload.role}, expired=${isExpired}`;
                            console.error('[API] 403 Token解析 - userId:', payload.userId);
                            console.error('[API] 403 Token解析 - username:', payload.sub);
                            console.error('[API] 403 Token解析 - role:', payload.role);
                            console.error('[API] 403 Token解析 - exp:', payload.exp);
                            console.error('[API] 403 Token解析 - 过期时间:', new Date(payload.exp * 1000).toISOString());
                            console.error('[API] 403 Token解析 - 是否过期:', isExpired);
                        }
                    } catch (e) {
                        debugInfo += `, parseError=${e.message}`;
                        console.error('[API] 403 Token解析失败:', e.message);
                    }
                }

                if (!currentToken) {
                    throw new Error('未登录，请先登录');
                } else {
                    // 把调试信息放到错误消息里
                    throw new Error(`登录验证失败(403): ${debugInfo}`);
                }
            }

            // 尝试提取后端返回的错误文字
            const errorMsg = error.response.data?.message || error.response.data || `请求失败 (${status})`;
            throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } else if (error.request) {
            // 发出了请求但没有收到响应 (通常是网络问题或后端没启动)
            throw new Error('网络连接失败，请检查后端服务是否启动');
        } else {
            throw new Error(error.message);
        }
    }
};

// 导出便捷方法
export default {
    get: (service, endpoint) => request(service, endpoint, { method: 'GET' }),
    post: (service, endpoint, data) => request(service, endpoint, { method: 'POST', body: data }),
    put: (service, endpoint, data) => request(service, endpoint, { method: 'PUT', body: data }),
    del: (service, endpoint) => request(service, endpoint, { method: 'DELETE' }),
};