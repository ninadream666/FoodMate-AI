import apiClient from './apiClient';

/**
 * AI 定价相关服务 (商家端)
 * 已修复：补全 /api 代理前缀以触发 Vite Proxy 转发
 */
export const aiPricingService = {
  // 1. 获取待审批提案
  getPendingProposals: (merchantId) => 
    apiClient.get(`/api/merchants/${merchantId}/price-proposals/pending`),

  // 2. 获取历史提案
  getProposalHistory: (merchantId) => 
    apiClient.get(`/api/merchants/${merchantId}/price-proposals/history`),

  // 3. 批准提案
  approveProposal: (merchantId, proposalId) => 
    apiClient.post(`/api/merchants/${merchantId}/price-proposals/${proposalId}/approve`),

  // 4. 拒绝提案
  rejectProposal: (merchantId, proposalId) => 
    apiClient.post(`/api/merchants/${merchantId}/price-proposals/${proposalId}/reject`),

  // 5. 开启/关闭自动审批
  updateAutoApprovalStatus: (merchantId, enable) => 
    apiClient.patch(`/api/merchants/${merchantId}/auto-approval/status?enable=${enable}`),

  // 6. 调整自动审批阈值
  updateThreshold: (merchantId, threshold) => 
    apiClient.patch(`/api/merchants/${merchantId}/auto-approval/threshold?threshold=${threshold}`),

  // 7. 手动触发 AI 分析周期
  triggerAiAnalysis: () => 
    apiClient.post('/api/ai-pricing/trigger-cycle', {}) 
};