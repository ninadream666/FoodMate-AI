import apiClient from './apiClient';

/**
 * AI 定价相关服务 
 */
export const aiPricingService = {
  // 获取待审批提案
  getPendingProposals: (merchantId) => 
    apiClient.get(`/api/merchants/${merchantId}/price-proposals/pending`),

  // 获取历史提案
  getProposalHistory: (merchantId) => 
    apiClient.get(`/api/merchants/${merchantId}/price-proposals/history`),

  // 批准提案
  approveProposal: (merchantId, proposalId) => 
    apiClient.post(`/api/merchants/${merchantId}/price-proposals/${proposalId}/approve`),

  // 拒绝提案
  rejectProposal: (merchantId, proposalId) => 
    apiClient.post(`/api/merchants/${merchantId}/price-proposals/${proposalId}/reject`),

  // 开启/关闭自动审批
  updateAutoApprovalStatus: (merchantId, enable) => 
    apiClient.patch(`/api/merchants/${merchantId}/auto-approval/status?enable=${enable}`),

  // 调整自动审批阈值
  updateThreshold: (merchantId, threshold) => 
    apiClient.patch(`/api/merchants/${merchantId}/auto-approval/threshold?threshold=${threshold}`),

  // 手动触发AI分析周期
  triggerAiAnalysis: () => 
    apiClient.post('/api/ai-pricing/trigger-cycle', {}) 
};