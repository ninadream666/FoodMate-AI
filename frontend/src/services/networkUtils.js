// src/services/networkUtils.js
import NetInfo from '@react-native-community/netinfo';

// ============ 网络状态单例 ============
// 维护全局网络状态，避免每次发请求都异步查询
let _isConnected = true;
let _connectionType = 'unknown';
let _isWifi = false;
let _listeners = [];

// 订阅网络变化（应在App启动时调用一次）
let _unsubscribe = null;

export const startNetworkMonitor = () => {
    if (_unsubscribe) return; // 避免重复订阅

    _unsubscribe = NetInfo.addEventListener(state => {
        const wasConnected = _isConnected;
        _isConnected = state.isConnected && state.isInternetReachable !== false;
        _connectionType = state.type;
        _isWifi = state.type === 'wifi';

        // 通知所有监听者
        _listeners.forEach(fn => fn({
            isConnected: _isConnected,
            connectionType: _connectionType,
            isWifi: _isWifi,
            justReconnected: !wasConnected && _isConnected,
        }));
    });
};

export const stopNetworkMonitor = () => {
    if (_unsubscribe) {
        _unsubscribe();
        _unsubscribe = null;
    }
};

/**
 * 添加网络状态变化监听器
 * @returns 取消监听的函数
 */
export const addNetworkListener = (callback) => {
    _listeners.push(callback);
    return () => {
        _listeners = _listeners.filter(fn => fn !== callback);
    };
};

/**
 * 同步获取当前网络状态（毫秒级，无异步开销）
 */
export const getNetworkStatus = () => ({
    isConnected: _isConnected,
    connectionType: _connectionType,
    isWifi: _isWifi,
});

/**
 * 判断当前是否适合执行大请求（如图片上传）
 * 弱网或离线时返回 false
 */
export const canPerformLargeRequest = () => {
    return _isConnected;
};

// 异步检查网络连接状态（首次或需要精确结果时使用）
export const checkNetworkConnection = async () => {
    try {
        const netInfo = await NetInfo.fetch();
        _isConnected = netInfo.isConnected && netInfo.isInternetReachable !== false;
        _connectionType = netInfo.type;
        _isWifi = netInfo.type === 'wifi';
        return {
            isConnected: _isConnected,
            connectionType: _connectionType,
            isWifi: _isWifi,
            details: netInfo.details,
        };
    } catch (error) {
        console.warn('网络状态检查失败:', error);
        return {
            isConnected: true,
            connectionType: 'unknown',
            isWifi: false,
            details: null,
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

            if (attempt < maxRetries && isRetryableError(error)) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }

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
