import api from './apiClient';

export const platformService = {
    // 获取所有可用服务（商家端）
    getAvailableServices: async (merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.get('merchantPlatform', query);
    },

    // 获取当前生效的订阅列表
    getActiveSubscriptions: async (merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.get('merchantPlatform', `/subscriptions${query}`);
    },

    // 获取全部订阅历史
    getAllSubscriptions: async (merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.get('merchantPlatform', `/subscriptions/all${query}`);
    },

    // 订阅服务
    subscribe: async (serviceId, merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.post('merchantPlatform', `/subscriptions${query}`, { serviceId });
    },

    // 取消订阅
    cancelSubscription: async (subscriptionId, reason = "商家主动取消", merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.del('merchantPlatform', `/subscriptions/${subscriptionId}${query}`, { reason });
    }
};