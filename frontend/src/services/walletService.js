// src/services/walletService.js
import api from './apiClient';

// 辅助函数：判断是否过期
export const isCouponExpired = (coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
};

export const walletService = {
    // 1. 获取余额（当前无后端钱包服务，显示为 0）
    getBalance: async () => {
        return { balance: 0.00, currency: '¥' };
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