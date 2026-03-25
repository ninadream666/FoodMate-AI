// src/utils/cacheUtils.js
// 缓存工具类 - 用于减少不必要的网络请求
import AsyncStorage from '@react-native-async-storage/async-storage';

// 内存缓存（快速访问）
const memoryCache = new Map();

// 缓存配置：不同类型数据的过期时间（毫秒）
const CACHE_TTL = {
    merchants: 2 * 60 * 1000,        // 商家数据 2 分钟
    recommendations: 5 * 60 * 1000,  // 推荐数据 5 分钟
    weather: 10 * 60 * 1000,         // 天气 10 分钟
    orders: 1 * 60 * 1000,           // 订单 1 分钟（变化频繁）
    menu: 5 * 60 * 1000,             // 菜单 5 分钟
    user: 30 * 60 * 1000,            // 用户信息 30 分钟
    default: 3 * 60 * 1000,          // 默认 3 分钟
};

// 缓存数据结构
const createCacheEntry = (data, ttl) => ({
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
});

// 检查缓存是否过期
const isExpired = (entry) => {
    if (!entry || !entry.expiresAt) return true;
    return Date.now() > entry.expiresAt;
};

// 生成缓存键
const generateCacheKey = (type, params = {}) => {
    const paramStr = Object.keys(params)
        .sort()
        .map(key => `${key}=${JSON.stringify(params[key])}`)
        .join('&');
    return `cache_${type}_${paramStr}`;
};

/**
 * 缓存服务
 */
export const cacheService = {
    /**
     * 获取缓存数据
     * @param {string} type - 缓存类型（merchants, recommendations, weather 等）
     * @param {object} params - 请求参数（用于生成唯一缓存键）
     * @returns {Promise<any|null>} - 缓存数据或 null
     */
    async get(type, params = {}) {
        const cacheKey = generateCacheKey(type, params);

        // 1. 先检查内存缓存
        const memEntry = memoryCache.get(cacheKey);
        if (memEntry && !isExpired(memEntry)) {
            console.log(`[Cache] 内存缓存命中: ${type}`);
            return memEntry.data;
        }

        // 2. 检查持久化缓存
        try {
            const stored = await AsyncStorage.getItem(cacheKey);
            if (stored) {
                const entry = JSON.parse(stored);
                if (!isExpired(entry)) {
                    // 更新内存缓存
                    memoryCache.set(cacheKey, entry);
                    console.log(`[Cache] 持久化缓存命中: ${type}`);
                    return entry.data;
                }
            }
        } catch (error) {
            console.warn('[Cache] 读取持久化缓存失败:', error);
        }

        console.log(`[Cache] 缓存未命中: ${type}`);
        return null;
    },

    /**
     * 设置缓存数据
     * @param {string} type - 缓存类型
     * @param {object} params - 请求参数
     * @param {any} data - 要缓存的数据
     * @param {number} customTTL - 自定义过期时间（可选）
     */
    async set(type, params = {}, data, customTTL = null) {
        const cacheKey = generateCacheKey(type, params);
        const ttl = customTTL || CACHE_TTL[type] || CACHE_TTL.default;
        const entry = createCacheEntry(data, ttl);

        // 1. 更新内存缓存
        memoryCache.set(cacheKey, entry);

        // 2. 持久化存储
        try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
            console.log(`[Cache] 已缓存: ${type}, TTL: ${ttl / 1000}s`);
        } catch (error) {
            console.warn('[Cache] 持久化缓存失败:', error);
        }
    },

    /**
     * 清除指定类型的缓存
     * @param {string} type - 缓存类型
     */
    async clear(type) {
        // 清除内存缓存中匹配的项
        for (const key of memoryCache.keys()) {
            if (key.startsWith(`cache_${type}_`)) {
                memoryCache.delete(key);
            }
        }

        // 清除持久化存储
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(`cache_${type}_`));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
            console.log(`[Cache] 已清除缓存: ${type}`);
        } catch (error) {
            console.warn('[Cache] 清除缓存失败:', error);
        }
    },

    /**
     * 清除所有缓存
     */
    async clearAll() {
        memoryCache.clear();

        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('cache_'));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
            console.log('[Cache] 已清除所有缓存');
        } catch (error) {
            console.warn('[Cache] 清除所有缓存失败:', error);
        }
    },

    /**
     * 使缓存失效（强制下次请求刷新）
     * @param {string} type - 缓存类型
     * @param {object} params - 请求参数
     */
    async invalidate(type, params = {}) {
        const cacheKey = generateCacheKey(type, params);
        memoryCache.delete(cacheKey);
        try {
            await AsyncStorage.removeItem(cacheKey);
        } catch (error) {
            // 忽略
        }
    },

    /**
     * 获取缓存统计信息（调试用）
     */
    getStats() {
        return {
            memoryEntries: memoryCache.size,
            types: [...new Set([...memoryCache.keys()].map(k => k.split('_')[1]))],
        };
    },
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export const debounce = (func, wait) => {
    let timeoutId = null;

    const debouncedFn = (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(null, args);
            timeoutId = null;
        }, wait);
    };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流后的函数
 */
export const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;

    return (...args) => {
        if (!lastRan) {
            func.apply(null, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if (Date.now() - lastRan >= limit) {
                    func.apply(null, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

/**
 * 图片 URL 优化工具
 */
export const imageUtils = {
    /**
     * 优化 Google 图片 URL，添加尺寸参数
     * @param {string} url - 原始图片 URL
     * @param {number} width - 目标宽度
     * @param {number} height - 目标高度（可选）
     * @returns {string} - 优化后的 URL
     */
    getOptimizedUrl(url, width = 300, height = null) {
        if (!url) return url;

        // 对 Google 图片添加尺寸参数
        if (url.includes('googleusercontent.com')) {
            // 移除已有的尺寸参数
            let cleanUrl = url.replace(/=w\d+(-h\d+)?(-[a-z]+)?$/i, '');
            // 添加新的尺寸参数
            if (height) {
                return `${cleanUrl}=w${width}-h${height}`;
            }
            return `${cleanUrl}=w${width}`;
        }

        return url;
    },

    /**
     * 预加载图片列表
     * @param {string[]} urls - 图片 URL 列表
     */
    preloadImages(urls) {
        // 如果使用 FastImage，可以调用 FastImage.preload
        // 这里提供一个基础实现
        const validUrls = urls.filter(url => url && typeof url === 'string');
        console.log(`[Image] 预加载 ${validUrls.length} 张图片`);
        return validUrls;
    },
};

export default {
    cacheService,
    debounce,
    throttle,
    imageUtils,
};
