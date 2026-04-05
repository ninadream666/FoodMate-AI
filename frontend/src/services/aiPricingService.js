import api from './apiClient';

export const aiPricingService = {
    // 获取待审批提案
    getPendingProposals: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/price-proposals/pending`);
    },

    // 获取历史提案
    getProposalHistory: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/price-proposals/history`);
    },

    // 批准提案
    approveProposal: async (merchantId, proposalId) => {
        return await api.post('merchants', `/${merchantId}/price-proposals/${proposalId}/approve`);
    },

    // 拒绝提案
    rejectProposal: async (merchantId, proposalId) => {
        return await api.post('merchants', `/${merchantId}/price-proposals/${proposalId}/reject`);
    },

    // 开启/关闭自动审批
    updateAutoApprovalStatus: async (merchantId, enable) => {
        return await api.patch('merchants', `/${merchantId}/auto-approval/status?enable=${enable}`);
    },

    // 调整自动审批阈值
    updateThreshold: async (merchantId, threshold) => {
        return await api.patch('merchants', `/${merchantId}/auto-approval/threshold?threshold=${threshold}`);
    },

    // 手动触发AI分析周期
    triggerAiAnalysis: async () => {
        return await api.post('ai-pricing', '/trigger-cycle', {});
    }
};
