import { merchantApi, API_ENDPOINTS } from './apiConfig';

class MerchantService {

    // ============== 商家基本管理 ==============

    // 获取商家列表（支持分页和筛选）
    async getMerchants(params = {}) {
        try {
            const {
                page = 0,
                size = 20,
                keyword,
                status,
                businessType,
                registrationDateStart,
                registrationDateEnd,
                sort = 'createdAt,desc'
            } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort
            });

            if (keyword) queryParams.append('keyword', keyword);
            if (status) queryParams.append('status', status);
            if (businessType) queryParams.append('businessType', businessType);
            if (registrationDateStart) queryParams.append('registrationDateStart', registrationDateStart);
            if (registrationDateEnd) queryParams.append('registrationDateEnd', registrationDateEnd);

            const response = await merchantApi.get(`/api/admin/merchants?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get merchants failed:', error);
            throw error;
        }
    }

    // 获取所有商家
    async getAllMerchants(params = {}) {
        return this.getMerchants(params);
    }

    // 获取商家详情
    async getMerchantById(merchantId) {
        try {
            const response = await merchantApi.get(`/api/admin/merchants/${merchantId}`);
            return response.data;
        } catch (error) {
            console.error('Get merchant detail failed:', error);
            throw error;
        }
    }

    // 获取当前商家信息 - 商家端使用
    async getMyMerchantInfo() {
        try {
            const response = await merchantApi.get('/merchants/my');
            return response.data;
        } catch (error) {
            console.error('Get my merchant info failed:', error);
            throw error;
        }
    }

    // 创建商家
    async createMerchant(merchantData) {
        try {
            const response = await merchantApi.post('/merchants', merchantData);
            return response.data;
        } catch (error) {
            console.error('Create merchant failed:', error);
            throw error;
        }
    }

    // 更新商家信息
    async updateMerchant(merchantId, merchantData) {
        try {
            const response = await merchantApi.put(`/merchants/${merchantId}`, merchantData);
            return response.data;
        } catch (error) {
            console.error('Update merchant failed:', error);
            throw error;
        }
    }

    // 启用/禁用商家
    async toggleMerchantStatus(merchantId, status) {
        try {
            const response = await merchantApi.patch(`/api/admin/merchants/${merchantId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Toggle merchant status failed:', error);
            throw error;
        }
    }

    // 审批商家申请
    async approveMerchant(merchantId, approved, reason = '') {
        try {
            const response = await merchantApi.patch(`/api/admin/merchants/${merchantId}/approve`, {
                approved,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Approve merchant failed:', error);
            throw error;
        }
    }

    // ============== 商家业务数据 ==============

    // 管理员获取商家统计数据（系统总览）
    async getMerchantAdminStats(params = {}) {
        try {
            const response = await merchantApi.get('/api/admin/merchants/stats', { params });
            return response.data;
        } catch (error) {
            console.error('Get merchant admin stats failed:', error);
            throw error;
        }
    }

    // 获取商家个人统计数据
    async getMerchantStats(merchantId, params = {}) {
        try {
            const { startDate, endDate } = params;
            const queryParams = new URLSearchParams();

            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await merchantApi.get(`/merchants/${merchantId}/stats?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get merchant stats failed:', error);
            throw error;
        }
    }

    // 获取商家已订阅服务
    async getMerchantServices(merchantId) {
        try {
            const response = await merchantApi.get(`/merchants/${merchantId}/services`);
            return response.data;
        } catch (error) {
            console.error('Get merchant services failed:', error);
            throw error;
        }
    }

    // 初始化商家服务
    async initializeMerchantServices(merchantId, serviceIds) {
        try {
            const response = await merchantApi.post(`/merchants/${merchantId}/initialize-services`, {
                serviceIds
            });
            return response.data;
        } catch (error) {
            console.error('Initialize merchant services failed:', error);
            throw error;
        }
    }

    // 批量更新商家状态
    async batchUpdateMerchantStatus(merchantIds, status, reason = '') {
        try {
            const response = await merchantApi.patch('/merchants/batch-status', {
                merchantIds,
                status,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Batch update merchant status failed:', error);
            throw error;
        }
    }
}

const merchantService = new MerchantService();
export default merchantService;