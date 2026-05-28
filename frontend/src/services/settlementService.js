import api from './apiClient';

export const settlementService = {
    // --- 统计数据 ---

    // 获取本月分成汇总（用于顶部卡片） - 调用commissions接口
    getThisMonthSummary: async (merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.get('merchantCommission', `/summary/this-month${query}`);
    },

    // 获取今日分成汇总（可选） - 调用commissions接口
    getTodaySummary: async (merchantId) => {
        const query = merchantId ? `?merchantId=${merchantId}` : '';
        return await api.get('merchantCommission', `/summary/today${query}`);
    },

    // --- 结算单管理 ---

    // 获取结算单列表（支持分页和状态筛选） - 调用settlements接口
    getSettlements: async (page = 0, size = 10, status = null, merchantId = null) => {
        let path = `?page=${page}&size=${size}`;
        if (status && status !== 'ALL') {
            path += `&status=${status}`;
        }
        if (merchantId) {
            path += `&merchantId=${merchantId}`;
        }
        return await api.get('merchantSettlement', path);
    },

    // 获取结算单详情 - 调用settlements接口
    getSettlementDetail: async (id) => {
        return await api.get('merchantSettlement', `/${id}`);
    },

    // 获取结算单内的分成记录 - 调用settlements接口
    getSettlementCommissions: async (settlementId, page = 0, size = 20) => {
        return await api.get('merchantSettlement', `/${settlementId}/commissions?page=${page}&size=${size}`);
    },

    // 确认结算单 - 调用settlements接口
    confirmSettlement: async (id) => {
        return await api.post('merchantSettlement', `/${id}/confirm`);
    },

    // 提交异议 - 调用settlements接口
    disputeSettlement: async (id, reason) => {
        return await api.post('merchantSettlement', `/${id}/dispute`, { reason });
    },

    // 获取待确认数量 - 调用settlements接口
    getPendingCount: async () => {
        try {
            return await api.get('merchantSettlement', '/pending-count');
        } catch (e) {
            return 0;
        }
    }
};