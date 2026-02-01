import api from './apiClient';

export const aiPricingService = {
    // 1. 获取待审批提案
    getPendingProposals: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/price-proposals/pending`);
    },

    // 2. 获取历史提案
    getProposalHistory: async (merchantId) => {
        return await api.get('merchants', `/${merchantId}/price-proposals/history`);
    },

    // 3. 批准提案
    approveProposal: async (merchantId, proposalId) => {
        return await api.post('merchants', `/${merchantId}/price-proposals/${proposalId}/approve`);
    },

    // 4. 拒绝提案
    rejectProposal: async (merchantId, proposalId) => {
        return await api.post('merchants', `/${merchantId}/price-proposals/${proposalId}/reject`);
    },

    // 5. 开启/关闭自动审批
    updateAutoApprovalStatus: async (merchantId, enable) => {
        // 注意：apiClient.patch 如果参数不同，可能需要调整。这里假设 api.patch(service, url)
        return await api.patch('merchants', `/${merchantId}/auto-approval/status?enable=${enable}`);
    },

    // 6. 调整自动审批阈值
    updateThreshold: async (merchantId, threshold) => {
        return await api.patch('merchants', `/${merchantId}/auto-approval/threshold?threshold=${threshold}`);
    },

    // 7. 手动触发 AI 分析周期
    triggerAiAnalysis: async () => {
        // 假设 'ai-pricing' 是 serviceConfig 中配置的服务名
        return await api.post('ai-pricing', '/trigger-cycle', {});
    }
};
