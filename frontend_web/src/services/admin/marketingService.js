import { marketingApi } from './apiConfig';

class MarketingService {

    // ============== 健康检查 ==============

    async healthCheck() {
        try {
            const response = await marketingApi.get('/coupons/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    // ============== 优惠券模板管理 ==============

    // 创建优惠券模板
    async createCouponTemplate(templateData) {
        try {
            const response = await marketingApi.post('/api/admin/coupons/templates', templateData);
            return response.data;
        } catch (error) {
            console.error('Create coupon template failed:', error);
            throw error;
        }
    }

    // 获取优惠券模板列表
    async getCouponTemplates(params = {}) {
        try {
            const response = await marketingApi.get('/api/admin/coupons/templates', { params });
            return response.data;
        } catch (error) {
            console.error('Get coupon templates failed:', error);
            throw error;
        }
    }

    // 切换优惠券模板状态
    async toggleCouponTemplate(templateId) {
        try {
            const response = await marketingApi.put(`/api/admin/coupons/templates/${templateId}/toggle`);
            return response.data;
        } catch (error) {
            console.error('Toggle coupon template failed:', error);
            throw error;
        }
    }

    // 启用优惠券模板
    async enableCouponTemplate(templateId) {
        try {
            const response = await marketingApi.put(`/api/admin/coupons/templates/${templateId}/enable`);
            return response.data;
        } catch (error) {
            console.error('Enable coupon template failed:', error);
            throw error;
        }
    }

    // 禁用优惠券模板
    async disableCouponTemplate(templateId) {
        try {
            const response = await marketingApi.put(`/api/admin/coupons/templates/${templateId}/disable`);
            return response.data;
        } catch (error) {
            console.error('Disable coupon template failed:', error);
            throw error;
        }
    }

    // 获取单个优惠券模板
    async getCouponTemplate(templateId) {
        try {
            const response = await marketingApi.get(`/api/admin/coupons/templates/${templateId}`);
            return response.data;
        } catch (error) {
            console.error('Get coupon template failed:', error);
            throw error;
        }
    }

    // 更新优惠券模板
    async updateCouponTemplate(templateId, templateData) {
        try {
            const response = await marketingApi.put(`/api/admin/coupons/templates/${templateId}`, templateData);
            return response.data;
        } catch (error) {
            console.error('Update coupon template failed:', error);
            throw error;
        }
    }

    // 删除优惠券模板
    async deleteCouponTemplate(templateId) {
        try {
            const response = await marketingApi.delete(`/api/admin/coupons/templates/${templateId}`);
            return response.data;
        } catch (error) {
            console.error('Delete coupon template failed:', error);
            throw error;
        }
    }

    // ============== 优惠券发放管理 ==============

    // 发放优惠券
    async issueCoupon(issueData) {
        try {
            const response = await marketingApi.post('/coupons/issue', issueData);
            return response.data;
        } catch (error) {
            console.error('Issue coupon failed:', error);
            throw error;
        }
    }

    // 管理员发放优惠券
    async adminIssueCoupon(issueData) {
        try {
            const response = await marketingApi.post('/api/coupons/admin/issue', issueData);
            return response.data;
        } catch (error) {
            console.error('Admin issue coupon failed:', error);
            throw error;
        }
    }

    // 管理员批量发放优惠券
    async adminIssueCouponBatch(issueData) {
        try {
            const response = await marketingApi.post('/api/coupons/admin/issue-batch', issueData);
            return response.data;
        } catch (error) {
            console.error('Admin batch issue coupon failed:', error);
            throw error;
        }
    }

    // 管理员发放优惠券
    async issueCouponByAdmin(issueData) {
        return this.adminIssueCoupon(issueData);
    }

    // ============== 用户优惠券查询 ==============

    // 获取用户可用优惠券
    async getUserAvailableCoupons(userId) {
        try {
            const response = await marketingApi.get(`/coupons/user/${userId}/available`);
            return response.data;
        } catch (error) {
            console.error('Get user available coupons failed:', error);
            throw error;
        }
    }

    // 获取用户所有优惠券
    async getUserAllCoupons(userId) {
        try {
            const response = await marketingApi.get(`/coupons/user/${userId}/all`);
            return response.data;
        } catch (error) {
            console.error('Get user all coupons failed:', error);
            throw error;
        }
    }

    // 获取用户优惠券，默认获取所有
    async getUserCoupons(userId, params = {}) {
        return this.getUserAllCoupons(userId);
    }

    // ============== 统计数据 ==============

    // ============== 营销活动 ==============

    // 获取活动列表
    async getCampaigns(params = {}) {
        try {
            const response = await marketingApi.get('/coupons/campaigns', { params });
            return response.data;
        } catch (error) {
            console.error('Get campaigns failed:', error);
            throw error;
        }
    }

    async createCampaign(campaignData) {
        try {
            const response = await marketingApi.post('/coupons/campaigns', campaignData);
            return response.data;
        } catch (error) {
            console.error('Create campaign failed:', error);
            throw error;
        }
    }

    // ============== 优惠券统计接口 ==============

    // 获取优惠券统计概览
    async getCouponStats() {
        try {
            // 添加缓存破坏时间戳确保获取最新数据
            const timestamp = Date.now();
            const response = await marketingApi.get(`/api/admin/coupons/stats?t=${timestamp}`);

            console.log('📊 优惠券统计API响应:', response.data);

            // 确保返回的数据结构正确
            const data = response.data || {};
            const result = {
                totalTemplates: data.totalTemplates || 0,        // 总模板数
                activeTemplates: data.activeTemplates || 0,      // 活跃模板数
                totalIssued: data.totalIssued || 0,            // 总发放数
                totalUsed: data.totalUsed || 0,                // 总使用数
                usageRate: data.usageRate || 0,                // 使用率
                totalSavings: data.totalSavings || 0,          // 总节省金额
                monthlyIssuance: data.monthlyIssuance || 0,    // 本月发放
                monthlyUsage: data.monthlyUsage || 0,          // 本月使用
                conversionRate: data.conversionRate || 0,      // 转化率
                averageDiscountAmount: data.averageDiscountAmount || 0  // 平均优惠金额
            };

            console.log('✅ 处理后的优惠券统计数据:', result);
            return result;
        } catch (error) {
            console.error('❌ Get coupon stats failed:', error);
            console.error('错误详情:', error.response?.data || error.message);
            throw error;
        }
    }

    // 获取优惠券使用趋势
    async getCouponUsageTrend(period = 'week') {
        try {
            const response = await marketingApi.get(`/api/admin/coupons/usage-trend?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Get coupon usage trend failed:', error);
            throw error;
        }
    }

    // 获取优惠券类型统计
    async getCouponTypeStats() {
        try {
            const response = await marketingApi.get('/api/admin/coupons/type-stats');
            return response.data;
        } catch (error) {
            console.error('Get coupon type stats failed:', error);
            throw error;
        }
    }
}

const marketingService = new MarketingService();
export default marketingService;