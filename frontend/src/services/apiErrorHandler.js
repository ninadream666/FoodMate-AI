// src/services/apiErrorHandler.js
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 错误处理类
export class ApiError extends Error {
    constructor(message, status = null, code = null, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

// 统一错误处理函数
export const handleApiError = (error, showAlert = true) => {
    console.error('API Error:', error);

    let userMessage = '';

    if (error instanceof ApiError) {
        switch (error.status) {
            case 400:
                userMessage = error.message || '请求参数有误';
                break;
            case 401:
                userMessage = '登录已过期，请重新登录';
                // 清除本地存储的认证信息
                clearAuthData();
                break;
            case 403:
                userMessage = '没有权限执行此操作';
                break;
            case 404:
                userMessage = '请求的资源不存在';
                break;
            case 500:
                userMessage = '服务器内部错误，请稍后重试';
                break;
            case 503:
                userMessage = '服务器暂时不可用，请稍后重试';
                break;
            default:
                userMessage = error.message || '请求失败，请稍后重试';
        }
    } else if (error.message === 'UNAUTHORIZED') {
        userMessage = '登录已过期，请重新登录';
        clearAuthData();
    } else if (error.message.includes('网络')) {
        userMessage = '网络连接失败，请检查网络设置';
    } else if (error.message.includes('timeout')) {
        userMessage = '请求超时，请检查网络或稍后重试';
    } else {
        userMessage = error.message || '未知错误';
    }

    if (showAlert && userMessage) {
        Alert.alert(
            '提示',
            userMessage,
            [{ text: '确定' }]
        );
    }

    return userMessage;
};

// 清除认证数据
const clearAuthData = async () => {
    try {
        await AsyncStorage.multiRemove(['token', 'user', 'userId']);
    } catch (e) {
        console.error('清除认证数据失败:', e);
    }
};

// 重试配置
export const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
};

// 指数退避重试
export const exponentialBackoffRetry = async (fn, config = RETRY_CONFIG) => {
    let lastError;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // 如果是认证错误或客户端错误，不重试
            if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
                throw error;
            }

            // 最后一次尝试，抛出错误
            if (attempt === config.maxRetries) {
                throw error;
            }

            // 计算延迟时间（指数退避）
            const delay = Math.min(
                config.baseDelay * Math.pow(2, attempt - 1),
                config.maxDelay
            );

            console.warn(`请求失败，${delay}ms 后进行第 ${attempt + 1} 次重试:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};