import apiClient from './apiClient';

/**
 * 商家订单与退款服务
 * 已重构：统一使用 apiClient，并严格对齐后端 RefundApprovalDto
 */
export const merchantOrderService = {
  
  // 获取商家的待审批退款订单列表
  // 对应: GET /merchants/{merchantId}/pending-refunds
  getPendingRefunds: async (merchantId) => {
    return await apiClient.get(`/api/merchants/${merchantId}/pending-refunds`);
  },

  // 商家批准或拒绝退款
  // 对应: PATCH /merchants/{merchantId}/orders/{orderId}/approve-cancel
  auditRefund: async (merchantId, orderId, approved, rejectReason) => {
    // 严格遵循后端 order-service 提供的 RefundApprovalDto 结构
    // 仅包含 orderId, approved, rejectReason
    const payload = {
      orderId: Number(orderId), 
      approved: Boolean(approved),
      rejectReason: approved ? null : (rejectReason ? String(rejectReason) : null)
    };

    return await apiClient.patch(`/api/merchants/${merchantId}/orders/${orderId}/approve-cancel`, payload);
  },

  // 获取商家待处理订单列表
  getPendingOrders: async (merchantId) => {
    return await apiClient.get(`/api/merchants/${merchantId}/orders/pending`);
  },

  // 商家接单
  acceptOrder: async (merchantId, orderId) => {
    return await apiClient.post(`/api/merchants/${merchantId}/orders/${orderId}/accept`);
  },

  // 商家拒单
  rejectOrder: async (merchantId, orderId, reason) => {
    return await apiClient.post(`/api/merchants/${merchantId}/orders/${orderId}/reject`, { reason });
  },

  // 商家更新订单进度
  updateProgress: async (merchantId, orderId, status) => {
    return await apiClient.post(`/api/merchants/${merchantId}/orders/${orderId}/progress`, { status });
  },
};