import { platformApi } from './apiConfig';

class SettlementService {

    // ============== 结算单管理 ==============

    // 获取结算单列表（支持分页和筛选）
    async getSettlements(params = {}) {
        try {
            const {
                page = 0,
                size = 20,
                merchantId,
                status,
                settlementType,
                startDate,
                endDate,
                sort = 'createdAt,desc'
            } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort
            });

            // 添加筛选条件
            if (merchantId) queryParams.append('merchantId', merchantId);
            if (status) queryParams.append('status', status);
            if (settlementType) queryParams.append('settlementType', settlementType);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(`/api/admin/settlements?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get settlements failed:', error);
            throw error;
        }
    }

    // 获取结算单详情
    async getSettlementById(settlementId) {
        try {
            const response = await platformApi.get(`/api/admin/settlements/${settlementId}`);
            return response.data;
        } catch (error) {
            console.error('Get settlement detail failed:', error);
            throw error;
        }
    }

    // 获取结算单的分成记录（支持分页）
    async getSettlementCommissions(settlementId, params = {}) {
        try {
            const { page = 0, size = 50 } = params;
            const response = await platformApi.get(
                `/api/admin/settlements/${settlementId}/commissions?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error('Get settlement commissions failed:', error);
            throw error;
        }
    }

    // 生成结算单
    async generateSettlement(data) {
        try {
            const response = await platformApi.post('/api/admin/settlements/generate', data);
            return response.data;
        } catch (error) {
            console.error('Generate settlement failed:', error);
            throw error;
        }
    }

    // 调整结算金额
    async adjustSettlement(settlementId, adjustmentData) {
        try {
            const response = await platformApi.post(
                `/api/admin/settlements/${settlementId}/adjust`,
                adjustmentData
            );
            return response.data;
        } catch (error) {
            console.error('Adjust settlement failed:', error);
            throw error;
        }
    }

    // 批量标记已打款
    async batchMarkAsPaid(settlementIds) {
        try {
            const response = await platformApi.post('/api/admin/settlements/batch-pay', {
                settlementIds
            });
            return response.data;
        } catch (error) {
            console.error('Batch mark paid failed:', error);
            throw error;
        }
    }

    // 注意: confirmSettlement 是商家端功能，平台管理端不需要
    // 商家确认结算单后，平台只需审核和打款

    // 取消结算单 (后端使用 POST 而非 PATCH)
    async cancelSettlement(settlementId, reason) {
        try {
            const response = await platformApi.post(`/api/admin/settlements/${settlementId}/cancel`, {
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Cancel settlement failed:', error);
            throw error;
        }
    }

    // ============== 分成记录管理 ==============

    // 获取所有分成记录（用于分析）
    async getCommissionRecords(params = {}) {
        try {
            const {
                page = 0,
                size = 20,
                merchantId,
                serviceId,
                status,
                startDate,
                endDate,
                sort = 'calculatedAt,desc'
            } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort
            });

            if (merchantId) queryParams.append('merchantId', merchantId);
            if (serviceId) queryParams.append('serviceId', serviceId);
            if (status) queryParams.append('status', status);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(`/api/admin/commissions?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get commission records failed:', error);
            throw error;
        }
    }

    // ============== 统计报表 ==============

    // 获取结算统计数据
    async getSettlementStats(params = {}) {
        try {
            const {
                startDate,
                endDate,
                groupBy = 'day' // day, week, month
            } = params;

            const queryParams = new URLSearchParams({ groupBy });
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(`/api/admin/settlements/stats?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get settlement stats failed:', error);
            throw error;
        }
    }

    // 获取商家结算概览
    async getMerchantSettlementOverview(merchantId, params = {}) {
        try {
            const { startDate, endDate } = params;
            const queryParams = new URLSearchParams();

            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(
                `/api/admin/merchants/${merchantId}/settlement-overview?${queryParams}`
            );
            return response.data;
        } catch (error) {
            console.error('Get merchant settlement overview failed:', error);
            throw error;
        }
    }

    // 导出结算数据
    async exportSettlements(params = {}) {
        try {
            const response = await platformApi.get('/api/admin/settlements/export', {
                params,
                responseType: 'blob' // 用于文件下载
            });
            return response.data;
        } catch (error) {
            console.error('Export settlements failed:', error);
            throw error;
        }
    }

    // ============== 分成统计接口 ==============

    // 获取分成统计概览
    async getSettlementStats() {
        try {
            const response = await platformApi.get('/api/admin/settlements/stats');
            return response.data;
        } catch (error) {
            console.error('Get settlement stats failed:', error);
            throw error;
        }
    }

    // 获取分成趋势分析
    async getSettlementTrend(period = 'week') {
        try {
            const response = await platformApi.get(`/api/admin/settlements/trend?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Get settlement trend failed:', error);
            throw error;
        }
    }

    // ============== 补充：手动触发操作接口 ==============

    // 手动触发月结算
    async triggerMonthlySettlement() {
        try {
            const response = await platformApi.post('/api/admin/settlements/trigger/monthly');
            return response.data;
        } catch (error) {
            console.error('Trigger monthly settlement failed:', error);
            throw error;
        }
    }

    // 手动触发周结算
    async triggerWeeklySettlement() {
        try {
            const response = await platformApi.post('/api/admin/settlements/trigger/weekly');
            return response.data;
        } catch (error) {
            console.error('Trigger weekly settlement failed:', error);
            throw error;
        }
    }

    // 手动触发自动确认
    async triggerAutoConfirm() {
        try {
            const response = await platformApi.post('/api/admin/settlements/trigger/auto-confirm');
            return response.data;
        } catch (error) {
            console.error('Trigger auto confirm failed:', error);
            throw error;
        }
    }
}

const settlementService = new SettlementService();
export default settlementService;