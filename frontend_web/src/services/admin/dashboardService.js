import { platformApi, userApi, merchantApi, orderApi, marketingApi, API_ENDPOINTS } from './apiConfig';

class DashboardService {

    // ============== 概览统计 ==============

    // 从各微服务聚合数据（备用方案）
    async _aggregateFromMicroservices() {
        console.log('[Dashboard] 使用备用方案：从各微服务聚合数据');

        const results = {
            totalUserCount: 0,
            totalMerchantCount: 0,
            activeMerchantCount: 0,
            todayOrderCount: 0,
            totalRevenue: 0,
            userGrowthRate: 0,
            merchantGrowthRate: 0,
            orderGrowthRate: 0
        };

        // 并行获取各服务数据
        const promises = [
            // User Service - 使用API_ENDPOINTS统计接口
            userApi.get(API_ENDPOINTS.USERS.ADMIN_STATS).then(res => {
                console.log('[Dashboard] User stats:', res.data);
                results.totalUserCount = res.data.totalUsers || res.data.totalCount || res.data.customerCount || 0;
                results.userGrowthRate = res.data.growthRate || 0;
            }).catch(e => console.warn('[Dashboard] User stats failed:', e.message)),

            // Merchant Service - 首先尝试统计接口，再尝试列表接口
            merchantApi.get(API_ENDPOINTS.MERCHANTS.ADMIN_STATS).then(res => {
                console.log('[Dashboard] Merchant stats:', res.data);
                results.totalMerchantCount = res.data.totalMerchants || res.data.totalCount || res.data.total || 0;
                results.activeMerchantCount = res.data.activeMerchants || res.data.activeCount || results.totalMerchantCount;
                results.merchantGrowthRate = res.data.growthRate || 0;
            }).catch(async (e) => {
                console.warn('[Dashboard] Merchant stats failed:', e.message);
                // 备用：使用列表接口
                try {
                    const res = await merchantApi.get(`${API_ENDPOINTS.MERCHANTS.ADMIN_ALL}?page=0&size=1`);
                    console.log('[Dashboard] Merchant list fallback:', res.data);
                    results.totalMerchantCount = res.data.totalElements || res.data.total || 0;
                    results.activeMerchantCount = results.totalMerchantCount;
                } catch (e2) {
                    console.warn('[Dashboard] Merchant fallback also failed:', e2.message);
                }
            }),

            // Order Service - 首先尝试统计接口（已知工作正常）
            orderApi.get(API_ENDPOINTS.ORDERS.ADMIN_STATS).then(res => {
                console.log('[Dashboard] Order stats:', res.data);
                results.todayOrderCount = res.data.todayOrderCount || res.data.totalOrders || 0;
                results.totalRevenue = res.data.totalRevenue || res.data.totalSales || 0;
                results.orderGrowthRate = res.data.growthRate || 0;
            }).catch(async (e) => {
                console.warn('[Dashboard] Order stats failed:', e.message);
                // 备用：使用列表接口
                try {
                    const res = await orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_ALL}?page=0&size=1`);
                    console.log('[Dashboard] Order list fallback:', res.data);
                    results.todayOrderCount = res.data.totalElements || res.data.total || 0;
                    results.totalRevenue = res.data.totalRevenue || 0;
                } catch (e2) {
                    console.warn('[Dashboard] Order fallback also failed:', e2.message);
                }
            })
        ];

        await Promise.allSettled(promises);
        console.log('[Dashboard] Aggregated results:', results);
        return results;
    }

    // 获取仪表盘概览数据
    async getDashboardOverview() {
        console.log('[Dashboard] 开始获取仪表盘概览数据...');

        try {
            // Platform Service Dashboard接口
            console.log('[Dashboard] 尝试使用平台服务统一接口...');
            const response = await platformApi.get(API_ENDPOINTS.DASHBOARD.OVERVIEW);
            console.log('✅ [Dashboard] 平台服务响应成功:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [Dashboard] 平台服务失败:', error);
            console.log('[Dashboard] 错误详情:', {
                message: error.message,
                code: error.code,
                status: error.originalError?.response?.status,
                statusText: error.originalError?.response?.statusText
            });

            // 如果Platform Service返回500错误或连接失败，尝试从各微服务聚合数据
            console.log('[Dashboard] 平台服务不可用，启用备用方案...');
            try {
                const result = await this._aggregateFromMicroservices();
                console.log('✅ [Dashboard] 备用方案成功:', result);
                return result;
            } catch (fallbackError) {
                console.error('❌ [Dashboard] 备用方案也失败:', fallbackError);
            }

            // 返回默认数据以避免页面崩溃
            console.log('[Dashboard] 返回默认数据');
            return {
                totalUserCount: 0,
                totalMerchantCount: 0,
                activeMerchantCount: 0,
                todayOrderCount: 0,
                totalRevenue: 0,
                userGrowthRate: 0,
                merchantGrowthRate: 0,
                orderGrowthRate: 0
            };
        }
    }

    // 获取关键指标数据（从仪表盘概览获取）
    async getKPIMetrics() {
        try {
            // 使用统一的仪表盘概览接口
            const overview = await this.getDashboardOverview();

            // 整合数据
            return {
                totalSales: {
                    amount: overview.totalRevenue || 0,
                    trend: overview.orderGrowthRate ? `${overview.orderGrowthRate > 0 ? '+' : ''}${overview.orderGrowthRate.toFixed(1)}%` : '+0%',
                    isUp: (overview.orderGrowthRate || 0) >= 0
                },
                newUsers: {
                    count: overview.totalUserCount || 0,
                    trend: overview.userGrowthRate ? `${overview.userGrowthRate > 0 ? '+' : ''}${overview.userGrowthRate.toFixed(1)}%` : '+0%',
                    isUp: (overview.userGrowthRate || 0) >= 0
                },
                activeMerchants: {
                    count: overview.activeMerchantCount || overview.totalMerchantCount || 0,
                    trend: overview.merchantGrowthRate ? `${overview.merchantGrowthRate > 0 ? '+' : ''}${overview.merchantGrowthRate.toFixed(1)}%` : '+0%',
                    isUp: (overview.merchantGrowthRate || 0) >= 0
                },
                todayOrders: {
                    count: overview.todayOrderCount || 0,
                    trend: overview.orderGrowthRate ? `${overview.orderGrowthRate > 0 ? '+' : ''}${overview.orderGrowthRate.toFixed(1)}%` : '+0%',
                    isUp: (overview.orderGrowthRate || 0) >= 0
                }
            };
        } catch (error) {
            console.error('获取KPI数据失败:', error);
            throw error;
        }
    }

    // 获取最新商家数据
    async getLatestMerchants(limit = 10) {
        try {
            const response = await merchantApi.get(`/api/admin/merchants/latest?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('获取最新商家数据失败:', error);
            // 尝试从商家列表获取
            try {
                const fallback = await merchantApi.get(`/merchants?page=0&size=${limit}&sort=createdAt,desc`);
                return fallback.data?.content || fallback.data || [];
            } catch (e) {
                throw error;
            }
        }
    }

    // 获取订单趋势数据（从仪表盘概览获取）
    async getOrderTrends(days = 7) {
        try {
            // 使用仪表盘概览接口获取订单趋势
            const overview = await this.getDashboardOverview();
            return overview.orderTrends || [];
        } catch (error) {
            console.error('获取订单趋势数据失败:', error);
            throw error;
        }
    }

    // 获取营销活动统计（从Marketing Service获取）
    async getMarketingStats() {
        try {
            const response = await marketingApi.get('/coupons/stats');
            return response.data;
        } catch (error) {
            console.error('获取营销统计数据失败:', error);
            // 返回空数据而非抛出错误
            return {
                activeCampaigns: 0,
                totalCoupons: 0,
                usedCoupons: 0,
                couponUsageRate: 0
            };
        }
    }

    // 获取系统通知
    async getSystemNotifications() {
        try {
            const response = await platformApi.get('/api/admin/notifications');
            return response.data;
        } catch (error) {
            console.error('获取系统通知失败:', error);
            return []; // 返回空数组
        }
    }

    // 获取平台统计概览
    async getPlatformStats() {
        try {
            const response = await platformApi.get('/api/admin/platform/stats');
            return response.data;
        } catch (error) {
            console.error('获取平台统计数据失败:', error);
            throw error;
        }
    }

    // ============== 独立统计接口（直接调用各微服务） ==============

    // 获取商家统计数据 - 直接调用merchant-service
    async getMerchantStats() {
        try {
            const response = await merchantApi.get('/api/admin/merchants/stats');
            return response.data;
            // 返回: { total, active, pending, suspended, newThisMonth, growthRate }
        } catch (error) {
            console.error('获取商家统计数据失败:', error);
            throw error;
        }
    }

    // 获取订单统计数据 - 直接调用order-service
    async getOrderStats() {
        try {
            const response = await orderApi.get('/api/admin/orders/stats');
            return response.data;
            // 返回: { total, todayOrders, totalRevenue, todayRevenue, growthRate, pending, processing, completed, cancelled }
        } catch (error) {
            console.error('获取订单统计数据失败:', error);
            throw error;
        }
    }
}

export default new DashboardService();