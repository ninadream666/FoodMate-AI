import api from './apiClient';

export const merchantOrderService = {
    // 获取商家的待审批退款订单列表
    getPendingRefunds: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/pending-refunds`);
    },

    // 商家批准或拒绝退款
    auditRefund: async (merchantId, orderId, approved, rejectReason) => {
        const payload = {
            approved,
            rejectReason: approved ? null : rejectReason
        };
        return await api.patch('merchants', `/${merchantId}/orders/${orderId}/approve-cancel`, payload);
    }
};