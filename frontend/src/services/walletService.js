// src/services/walletService.js
import api from './apiClient';

// 辅助函数：判断是否过期
export const isCouponExpired = (coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
};

export const walletService = {
    // 获取余额
    getBalance: async () => {
        return { balance: 0.00, currency: '¥' };
    },

    // 获取用户所有优惠券
    getAllCoupons: async (userId) => {
        try {
            const result = await api.get('coupons', `/user/${userId}/all`);
            return result.data || [];
        } catch (error) {
            console.warn('获取优惠券失败，返回空列表', error);
            return [];
        }
    },

    // 领取优惠券
    claimCoupon: async (couponTemplateId, userId) => {
        return await api.post('coupons', '/issue', { couponTemplateId, userId });
    },

    isCouponExpired // 导出辅助函数
};