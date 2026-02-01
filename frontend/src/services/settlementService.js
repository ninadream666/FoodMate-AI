import api from './apiClient';

// 模仿网页端的写法
// API_BASE_SETTLEMENT = '/api/merchant/settlements'
// API_BASE_COMMISSION = '/api/merchant/commissions'

export const settlementService = {
    // --- 统计数据 ---

    // 获取本月分成汇总 (用于顶部卡片) - 调用 commissions 接口
    getThisMonthSummary: async () => {
        return await api.get('merchantCommission', '/summary/this-month');
    },

    // 获取今日分成汇总 (可选) - 调用 commissions 接口
    getTodaySummary: async () => {
        return await api.get('merchantCommission', '/summary/today');
    },

    // --- 结算单管理 ---

    // 获取结算单列表 (支持分页和状态筛选) - 调用 settlements 接口
    getSettlements: async (page = 0, size = 10, status = null) => {
        let path = `?page=${page}&size=${size}`;
        if (status && status !== 'ALL') {
            path += `&status=${status}`;
        }
        return await api.get('merchantSettlement', path);
    },

    // 获取结算单详情 - 调用 settlements 接口
    getSettlementDetail: async (id) => {
        return await api.get('merchantSettlement', `/${id}`);
    },

    // 获取结算单内的分成记录 - 调用 settlements 接口
    getSettlementCommissions: async (settlementId, page = 0, size = 20) => {
        return await api.get('merchantSettlement', `/${settlementId}/commissions?page=${page}&size=${size}`);
    },

    // 确认结算单 - 调用 settlements 接口
    confirmSettlement: async (id) => {
        return await api.post('merchantSettlement', `/${id}/confirm`);
    },

    // 提交异议 - 调用 settlements 接口
    disputeSettlement: async (id, reason) => {
        return await api.post('merchantSettlement', `/${id}/dispute`, { reason });
    },

    // 获取待确认数量 - 调用 settlements 接口
    getPendingCount: async () => {
        try {
            return await api.get('merchantSettlement', '/pending-count');
        } catch (e) {
            return 0;
        }
    }
};