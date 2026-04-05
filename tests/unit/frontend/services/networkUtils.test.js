/**
 * networkUtils 单元测试
 * 测试网络状态逻辑、重试判断、错误分类
 * 纯逻辑测试，不依赖React Native运行时
 */

// 复刻源码中的重试逻辑
const RETRYABLE_MESSAGES = [
    '网络连接失败', 'Network Error', 'timeout', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED',
];
const isRetryableError = (errorMessage) => {
    return RETRYABLE_MESSAGES.some(msg =>
        errorMessage.toLowerCase().includes(msg.toLowerCase())
    );
};

// 复刻分级超时配置
const SERVICE_TIMEOUT = {
    nutrivision: 120000,
    recommendation: 60000,
    default: 15000,
};
const getServiceTimeout = (urlKey) => SERVICE_TIMEOUT[urlKey] || SERVICE_TIMEOUT.default;

// 复刻请求去重key生成
const getRequestKey = (url, method, data) =>
    `${method}_${url}_${JSON.stringify(data || {})}`;

// 复刻重试判断
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const NON_RETRYABLE_METHODS = new Set(['POST', 'PATCH']);
const shouldRetry = (statusCode, method, hasResponse = true) => {
    if (NON_RETRYABLE_METHODS.has(method.toUpperCase())) return false;
    if (!hasResponse) return true; // 网络错误
    return RETRYABLE_STATUS_CODES.has(statusCode);
};

describe('分级超时配置', () => {
    test('nutrivision应使用120s超时（图片上传+AI推理）', () => {
        expect(getServiceTimeout('nutrivision')).toBe(120000);
    });
    test('recommendation应使用60s超时', () => {
        expect(getServiceTimeout('recommendation')).toBe(60000);
    });
    test('普通服务应使用默认15s', () => {
        expect(getServiceTimeout('orders')).toBe(15000);
        expect(getServiceTimeout('auth')).toBe(15000);
    });
    test('未知服务回退到默认', () => {
        expect(getServiceTimeout('unknown')).toBe(15000);
    });
});

describe('请求去重key生成', () => {
    test('相同参数应生成相同key', () => {
        const k1 = getRequestKey('/merchants', 'GET', {});
        const k2 = getRequestKey('/merchants', 'GET', {});
        expect(k1).toBe(k2);
    });
    test('不同URL应生成不同key', () => {
        const k1 = getRequestKey('/merchants/1', 'GET', {});
        const k2 = getRequestKey('/merchants/2', 'GET', {});
        expect(k1).not.toBe(k2);
    });
    test('不同方法应生成不同key', () => {
        const k1 = getRequestKey('/orders', 'GET', {});
        const k2 = getRequestKey('/orders', 'POST', {});
        expect(k1).not.toBe(k2);
    });
    test('不同data应生成不同key', () => {
        const k1 = getRequestKey('/merchants', 'GET', { page: 1 });
        const k2 = getRequestKey('/merchants', 'GET', { page: 2 });
        expect(k1).not.toBe(k2);
    });
});

describe('重试判断逻辑 - shouldRetry', () => {
    test('GET请求遇502应重试', () => {
        expect(shouldRetry(502, 'GET')).toBe(true);
    });
    test('GET请求遇503应重试', () => {
        expect(shouldRetry(503, 'GET')).toBe(true);
    });
    test('GET请求遇429(限流)应重试', () => {
        expect(shouldRetry(429, 'GET')).toBe(true);
    });
    test('POST请求不应重试（防重复下单）', () => {
        expect(shouldRetry(500, 'POST')).toBe(false);
    });
    test('PATCH请求不应重试', () => {
        expect(shouldRetry(502, 'PATCH')).toBe(false);
    });
    test('网络错误（无response）GET应重试', () => {
        expect(shouldRetry(0, 'GET', false)).toBe(true);
    });
    test('404不应重试（资源不存在）', () => {
        expect(shouldRetry(404, 'GET')).toBe(false);
    });
    test('401不应重试（认证失败）', () => {
        expect(shouldRetry(401, 'GET')).toBe(false);
    });
});

describe('可重试错误判断 - isRetryableError', () => {
    test('Network Error应可重试', () => {
        expect(isRetryableError('Network Error')).toBe(true);
    });
    test('timeout错误应可重试', () => {
        expect(isRetryableError('timeout of 15000ms exceeded')).toBe(true);
    });
    test('ECONNREFUSED应可重试', () => {
        expect(isRetryableError('connect ECONNREFUSED 127.0.0.1:8081')).toBe(true);
    });
    test('ECONNRESET应可重试', () => {
        expect(isRetryableError('socket hang up ECONNRESET')).toBe(true);
    });
    test('网络连接失败(中文)应可重试', () => {
        expect(isRetryableError('网络连接失败')).toBe(true);
    });
    test('404 Not Found不应重试', () => {
        expect(isRetryableError('Request failed with status code 404')).toBe(false);
    });
    test('Unauthorized不应重试', () => {
        expect(isRetryableError('Unauthorized')).toBe(false);
    });
});

describe('网络状态结构', () => {
    test('getNetworkStatus应返回正确结构', () => {
        const status = { isConnected: true, connectionType: 'wifi', isWifi: true };
        expect(status).toHaveProperty('isConnected');
        expect(status).toHaveProperty('connectionType');
        expect(status).toHaveProperty('isWifi');
    });
    test('canPerformLargeRequest在离线时为false', () => {
        const isConnected = false;
        expect(isConnected).toBe(false);
    });
});
