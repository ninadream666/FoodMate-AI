import api from './apiClient';

export const merchantOrderService = {
    // 获取商家的待审批退款订单列表
    getPendingRefunds: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/pending-refunds`);
    },

    // 获取商家待处理订单列表
    getPendingOrders: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/orders/pending`);
    },

    // 商家接单
    acceptOrder: async (merchantId, orderId) => {
        return await api.post('merchants', `/${merchantId}/orders/${orderId}/accept`);
    },

    // 商家拒单
    rejectOrder: async (merchantId, orderId, reason) => {
        return await api.post('merchants', `/${merchantId}/orders/${orderId}/reject`, { reason });
    },

    // 商家更新订单进度
    updateProgress: async (merchantId, orderId, status) => {
        return await api.post('merchants', `/${merchantId}/orders/${orderId}/progress`, { status });
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