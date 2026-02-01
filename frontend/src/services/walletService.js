// src/services/walletService.js
import api from './apiClient';

// 模拟数据 (当后端未准备好时兜底)
const MOCK_WALLET = { balance: 128.00, currency: '¥' };

// 辅助函数：判断是否过期
export const isCouponExpired = (coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
};

export const walletService = {
    // 1. 获取余额 (模拟)
    getBalance: async () => {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_WALLET;
    },

    // 2. 获取用户所有优惠券
    getAllCoupons: async (userId) => {
        try {
            // 对应 Web 的 GET /api/coupons/user/{userId}/all
            // 注意：这里的 'coupons' 对应 serviceConfig.js 里的配置
            const result = await api.get('coupons', `/user/${userId}/all`);
            return result.data || [];
        } catch (error) {
            console.warn('获取优惠券失败，返回空列表', error);
            return [];
        }
    },

    // 3. 领取优惠券
    claimCoupon: async (couponTemplateId, userId) => {
        return await api.post('coupons', '/issue', { couponTemplateId, userId });
    },

    isCouponExpired // 导出辅助函数
};