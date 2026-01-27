// 基础 URL
const API_BASE_SETTLEMENT = '/api/merchant/settlements';
const API_BASE_COMMISSION = '/api/merchant/commissions';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const settlementService = {
  // --- 统计数据 ---

  // 获取本月分成汇总 (用于顶部卡片)
  getThisMonthSummary: async () => {
    const response = await fetch(`${API_BASE_COMMISSION}/summary/this-month`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('获取本月统计失败');
    return await response.json();
  },

  // 获取今日分成汇总 (可选)
  getTodaySummary: async () => {
    const response = await fetch(`${API_BASE_COMMISSION}/summary/today`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('获取今日统计失败');
    return await response.json();
  },

  // --- 结算单管理 ---

  // 获取结算单列表 (支持分页和状态筛选)
  getSettlements: async (page = 0, size = 10, status = null) => {
    let url = `${API_BASE_SETTLEMENT}?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) throw new Error('获取结算单列表失败');
    return await response.json(); // 返回 Page<MerchantSettlementDTO>
  },

  // 获取结算单详情 (10.43)
  getSettlementDetail: async (id) => {
    const response = await fetch(`${API_BASE_SETTLEMENT}/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('获取结算单详情失败');
    return await response.json();
  },

  // 获取结算单内的分成记录 (10.44)
  getSettlementCommissions: async (settlementId, page = 0, size = 20) => {
    const response = await fetch(`${API_BASE_SETTLEMENT}/${settlementId}/commissions?page=${page}&size=${size}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('获取分成明细失败');
    return await response.json();
  },

  // 确认结算单 (10.45)
  confirmSettlement: async (id) => {
    const response = await fetch(`${API_BASE_SETTLEMENT}/${id}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('确认结算单失败');
    return await response.json();
  },

  // 提交异议 (10.46)
  disputeSettlement: async (id, reason) => {
    const response = await fetch(`${API_BASE_SETTLEMENT}/${id}/dispute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('提交异议失败');
    return await response.json();
  },
  
  // 获取待确认数量 (10.47)
  getPendingCount: async () => {
    const response = await fetch(`${API_BASE_SETTLEMENT}/pending-count`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!response.ok) return 0;
    return await response.json();
  }
};