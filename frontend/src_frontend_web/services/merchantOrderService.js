// 基础 URL指向 merchant-service (8081)
// 对应 vite.config.js 中的 /api/merchants 代理
const API_BASE = '/api/merchants';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const merchantOrderService = {
  // 获取商家的待审批退款订单列表
  // 对应: GET /merchants/{merchantId}/pending-refunds
  getPendingRefunds: async (merchantId) => {
    const response = await fetch(`${API_BASE}/${merchantId}/pending-refunds`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('获取待审批退款列表失败');
    return await response.json();
  },

  // 商家批准或拒绝退款
  // 对应: PATCH /merchants/{merchantId}/orders/{orderId}/approve-cancel
  auditRefund: async (merchantId, orderId, approved, rejectReason) => {
    const payload = {
      approved,
      rejectReason: approved ? null : rejectReason
    };

    const response = await fetch(`${API_BASE}/${merchantId}/orders/${orderId}/approve-cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || '操作失败');
    }
    // 接口可能返回更新后的对象或 void，这里简单返回 true 即可
    return true;
  }
};