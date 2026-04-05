import { platformApi } from './apiConfig';

class PlatformService {
    // 获取所有平台服务
    async getAllServices() {
        try {
            const response = await platformApi.get('/api/admin/platform-services');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取所有平台服务
    async getServices(params = {}) {
        try {
            const { page = 0, size = 50, status, category, keyword } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });
            if (status) queryParams.append('status', status);
            if (category) queryParams.append('category', category);
            if (keyword) queryParams.append('keyword', keyword);

            const response = await platformApi.get(`/api/admin/platform-services?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get services failed:', error);
            throw error;
        }
    }

    // 获取服务统计数据
    async getServiceStatistics() {
        try {
            const response = await platformApi.get('/api/admin/platform-services/statistics');
            return response.data;
        } catch (error) {
            console.error('Get service statistics failed:', error);
            throw error;
        }
    }

    // 创建新服务
    async createService(serviceData) {
        try {
            const response = await platformApi.post('/api/admin/platform-services', serviceData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 更新服务
    async updateService(serviceId, serviceData) {
        try {
            const response = await platformApi.put(`/api/admin/platform-services/${serviceId}`, serviceData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 切换服务状态
    async toggleServiceStatus(serviceId) {
        try {
            const response = await platformApi.patch(`/api/admin/platform-services/${serviceId}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取服务订阅数量
    async getServiceSubscriptionCount(serviceId) {
        try {
            const response = await platformApi.get(`/api/admin/platform-services/${serviceId}/subscriptions/count`);
            return response.data;
        } catch (error) {
            console.error('Get service subscription count failed:', error);
            throw error;
        }
    }

    // 删除服务
    async deleteService(serviceId) {
        try {
            const response = await platformApi.delete(`/api/admin/platform-services/${serviceId}`);
            return response.data;
        } catch (error) {
            console.error('Delete service failed:', error);
            throw error;
        }
    }

    // 批量操作服务
    async batchUpdateServices(serviceIds, updateData) {
        try {
            const response = await platformApi.patch('/api/admin/platform-services/batch', {
                serviceIds,
                ...updateData
            });
            return response.data;
        } catch (error) {
            console.error('Batch update services failed:', error);
            throw error;
        }
    }

    // ============== 商家服务订阅管理 ==============

    // 获取商家服务订阅情况
    async getMerchantServiceSubscriptions(merchantId) {
        try {
            const response = await platformApi.get(`/api/admin/merchants/${merchantId}/service-subscriptions`);
            return response.data;
        } catch (error) {
            console.error('Get merchant service subscriptions failed:', error);
            throw error;
        }
    }

    // 为商家订阅服务
    async subscribeMerchantToService(merchantId, serviceId) {
        try {
            const response = await platformApi.post(`/api/admin/merchants/${merchantId}/subscribe/${serviceId}`);
            return response.data;
        } catch (error) {
            console.error('Subscribe merchant to service failed:', error);
            throw error;
        }
    }

    // 取消商家服务订阅
    async unsubscribeMerchantFromService(merchantId, serviceId) {
        try {
            const response = await platformApi.delete(`/api/admin/merchants/${merchantId}/subscribe/${serviceId}`);
            return response.data;
        } catch (error) {
            console.error('Unsubscribe merchant from service failed:', error);
            throw error;
        }
    }

    // ============== 分成管理 ==============

    // 获取商家分成信息
    async getMerchantCommissions(params = {}) {
        try {
            const {
                page = 0,
                size = 20,
                merchantId,
                serviceId,
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
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(`/api/admin/merchant-commissions?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get merchant commissions failed:', error);
            throw error;
        }
    }

    // 手动触发分成计算
    async triggerCommissionCalculation(params) {
        try {
            const response = await platformApi.post('/api/admin/commissions/calculate', params);
            return response.data;
        } catch (error) {
            console.error('Trigger commission calculation failed:', error);
            throw error;
        }
    }

    // 初始化商家服务
    async initializeMerchantServices(merchantId, serviceIds) {
        try {
            const response = await platformApi.post(`/api/admin/merchants/${merchantId}/initialize-services`, {
                serviceIds
            });
            return response.data;
        } catch (error) {
            console.error('Initialize merchant services failed:', error);
            throw error;
        }
    }

    // ============== 平台统计 ==============

    // 获取平台服务统计
    async getPlatformServiceStats(params = {}) {
        try {
            const { startDate, endDate, groupBy = 'day' } = params;
            const queryParams = new URLSearchParams({ groupBy });

            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await platformApi.get(`/api/admin/platform-services/stats?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get platform service stats failed:', error);
            throw error;
        }
    }

    // 获取服务收入统计
    async getServiceRevenueStats(serviceId, params = {}) {
        try {
            const response = await platformApi.get(`/api/admin/platform-services/${serviceId}/revenue-stats`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error('Get service revenue stats failed:', error);
            throw error;
        }
    }

    // ============== 分成统计API ==============

    // 获取分成统计概览
    async getCommissionStats(params = {}) {
        try {
            const { startDate, endDate } = params;
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            // 后端接口: /api/admin/settlements/stats
            const response = await platformApi.get(`/api/admin/settlements/stats?${queryParams}`);
            const data = response.data;

            // 将结算统计数据映射为分成统计格式
            return {
                todayCommission: data.todayCommission || data.todayAmount || 0,
                monthlyCommission: data.monthlyCommission || data.monthlyAmount || 0,
                pendingAmount: data.pendingAmount || data.pendingSettlements || 0,
                avgRate: data.avgRate || data.commissionRate || 0,
                todayTrend: data.todayTrend || 0,
                monthlyTrend: data.monthlyTrend || 0,
                pendingTrend: data.pendingTrend || 0,
                rateTrend: data.rateTrend || 0
            };
        } catch (error) {
            console.error('Get commission stats failed:', error);
            throw error;
        }
    }

    // 获取分成趋势数据
    async getCommissionTrends(days = 7) {
        try {
            const response = await platformApi.get('/api/admin/dashboard/overview');
            const data = response.data;

            // 从仪表盘概览提取订单趋势数据
            if (data && data.orderTrends && Array.isArray(data.orderTrends)) {
                return data.orderTrends.map(item => ({
                    date: item.date || item.label,
                    amount: item.amount || 0,
                    count: item.count || 0,
                    value: item.amount || 0
                }));
            }
            return [];
        } catch (error) {
            console.error('Get commission trends failed:', error);
            throw error;
        }
    }

    // 获取商家分成贡献排名
    async getTopMerchantContributions(limit = 5) {
        try {
            const response = await platformApi.get(`/api/admin/settlements/top-merchants?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Get top merchant contributions failed:', error);
            // 如果不存在，返回空数组
            return [];
        }
    }

    // 获取特定结算单的分成记录
    async getSettlementCommissions(settlementId) {
        try {
            const response = await platformApi.get(`/api/admin/settlements/${settlementId}/commissions`);
            return response.data;
        } catch (error) {
            console.error('Get settlement commissions failed:', error);
            throw error;
        }
    }

}

const platformService = new PlatformService();
export default platformService;