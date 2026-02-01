// src/services/networkUtils.js
import NetInfo from '@react-native-community/netinfo';

// 检查网络连接状态
export const checkNetworkConnection = async () => {
    try {
        const netInfo = await NetInfo.fetch();
        return {
            isConnected: netInfo.isConnected && netInfo.isInternetReachable,
            connectionType: netInfo.type,
            details: netInfo.details
        };
    } catch (error) {
        console.warn('网络状态检查失败:', error);
        return {
            isConnected: true, // 如果检查失败，假设有网络
            connectionType: 'unknown',
            details: null
        };
    }
};

// 重试机制
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;
            console.warn(`请求失败 (第${attempt}/${maxRetries}次)`, error.message);

            // 如果是网络错误且还有重试次数，等待后重试
            if (attempt < maxRetries && isRetryableError(error)) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }

            // 否则抛出错误
            throw error;
        }
    }

    throw lastError;
};

// 判断是否为可重试的错误
const isRetryableError = (error) => {
    const retryableMessages = [
        '网络连接失败',
        'Network Error',
        'timeout',
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED'
    ];

    return retryableMessages.some(msg =>
        error.message.toLowerCase().includes(msg.toLowerCase())
    );
};