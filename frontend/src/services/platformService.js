import api from './apiClient';

export const platformService = {
    // 获取所有可用服务（商家端）
    getAvailableServices: async () => {
        return await api.get('merchantPlatform', ''); // 使用商家端平台服务
    },

    // 获取当前生效的订阅列表
    getActiveSubscriptions: async () => {
        return await api.get('merchantPlatform', '/subscriptions');
    },

    // 获取全部订阅历史
    getAllSubscriptions: async () => {
        return await api.get('merchantPlatform', '/subscriptions/all');
    },

    // 订阅服务
    subscribe: async (serviceId) => {
        return await api.post('merchantPlatform', '/subscriptions', { serviceId });
    },

    // 取消订阅
    cancelSubscription: async (subscriptionId, reason = "商家主动取消") => {
        // DELETE 请求带 body 在某些 fetch 实现中可能被忽略，但在 axios/apiClient 中通常支持
        return await api.del('merchantPlatform', `/subscriptions/${subscriptionId}`, { reason });
    }
};