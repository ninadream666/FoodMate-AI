import { orderApi, platformApi, API_ENDPOINTS } from './apiConfig';

/**
 * 订单统计服务 - 基于API测试文件的完整接口分析
 * 整合订单服务(8084)和平台服务(8088)的统计数据
 */
class OrderStatsService {

    // ============== 订单基础统计 ==============

    // 获取订单统计概览
    async getOrderStats(params = {}) {
        try {
            const { startDate, endDate, groupBy = 'day' } = params;
            const queryParams = new URLSearchParams({ groupBy });

            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_STATS}?${queryParams}`);
            console.log('📊 订单统计数据:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取订单统计失败:', error);
            throw error;
        }
    }

    // 获取总销售额
    async getTotalSales(params = {}) {
        try {
            const response = await orderApi.get(API_ENDPOINTS.ORDERS.ADMIN_SALES, { params });
            console.log('💰 总销售额数据:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取总销售额失败:', error);
            throw error;
        }
    }

    // 获取今日订单数
    async getTodayOrderCount() {
        try {
            const response = await orderApi.get(API_ENDPOINTS.ORDERS.ADMIN_TODAY);
            console.log('📈 今日订单数:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取今日订单数失败:', error);
            throw error;
        }
    }

    // 获取最近7天订单趋势
    async getOrderTrends(params = {}) {
        try {
            const response = await orderApi.get(API_ENDPOINTS.ORDERS.ADMIN_TRENDS, { params });
            console.log('📊 订单趋势数据:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取订单趋势失败:', error);
            throw error;
        }
    }

    // ============== 分成数据统计 ==============

    // 获取订单分成详情(内部接口)
    async getOrderCommission(orderId) {
        try {
            const response = await platformApi.get(`${API_ENDPOINTS.COMMISSIONS.ORDER_COMMISSION}/${orderId}`);
            console.log('🏢 订单分成详情:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取订单分成详情失败:', error);
            throw error;
        }
    }

    // 获取本月分成汇总
    async getMonthlyCommissionSummary() {
        try {
            const response = await platformApi.get(API_ENDPOINTS.COMMISSIONS.MONTHLY_SUMMARY);
            console.log('📊 本月分成汇总:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取本月分成汇总失败:', error);
            throw error;
        }
    }

    // 获取指定时间范围分成汇总
    async getCommissionSummary(params = {}) {
        try {
            const { startTime, endTime } = params;
            const queryParams = new URLSearchParams();

            if (startTime) queryParams.append('startTime', startTime);
            if (endTime) queryParams.append('endTime', endTime);

            const response = await platformApi.get(`${API_ENDPOINTS.COMMISSIONS.MERCHANT_SUMMARY}?${queryParams}`);
            console.log('📈 分成汇总数据:', response.data);
            return response.data;
        } catch (error) {
            console.error('获取分成汇总失败:', error);
            throw error;
        }
    }

    // ============== 综合统计方法 ==============

    // 获取仪表盘综合数据
    async getDashboardStats(params = {}) {
        try {
            console.log('🔄 正在获取仪表盘综合数据...');

            const promises = [
                this.getOrderStats(params),
                this.getTotalSales(params),
                this.getTodayOrderCount(),
                this.getOrderTrends(params),
                this.getMonthlyCommissionSummary()
            ];

            const [
                orderStats,
                totalSales,
                todayCount,
                trends,
                commissionSummary
            ] = await Promise.allSettled(promises);

            const dashboardData = {
                orderStats: orderStats.status === 'fulfilled' ? orderStats.value : null,
                totalSales: totalSales.status === 'fulfilled' ? totalSales.value : null,
                todayCount: todayCount.status === 'fulfilled' ? todayCount.value : null,
                trends: trends.status === 'fulfilled' ? trends.value : null,
                commissionSummary: commissionSummary.status === 'fulfilled' ? commissionSummary.value : null,

                // 记录失败的请求
                errors: [
                    orderStats.status === 'rejected' ? { type: 'orderStats', error: orderStats.reason } : null,
                    totalSales.status === 'rejected' ? { type: 'totalSales', error: totalSales.reason } : null,
                    todayCount.status === 'rejected' ? { type: 'todayCount', error: todayCount.reason } : null,
                    trends.status === 'rejected' ? { type: 'trends', error: trends.reason } : null,
                    commissionSummary.status === 'rejected' ? { type: 'commissionSummary', error: commissionSummary.reason } : null
                ].filter(Boolean)
            };

            console.log('📊 仪表盘数据整合完成:', dashboardData);
            return dashboardData;

        } catch (error) {
            console.error('获取仪表盘数据失败:', error);
            throw error;
        }
    }

    // 获取订单详情及分成信息
    async getOrderDetailWithCommission(orderId) {
        try {
            console.log(`🔍 正在获取订单 ${orderId} 的详细信息和分成数据...`);

            const promises = [
                orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_DETAIL}/${orderId}`),
                this.getOrderCommission(orderId)
            ];

            const [orderDetail, commissionDetail] = await Promise.allSettled(promises);

            return {
                orderDetail: orderDetail.status === 'fulfilled' ? orderDetail.value.data : null,
                commissionDetail: commissionDetail.status === 'fulfilled' ? commissionDetail.value : null,
                errors: [
                    orderDetail.status === 'rejected' ? { type: 'orderDetail', error: orderDetail.reason } : null,
                    commissionDetail.status === 'rejected' ? { type: 'commissionDetail', error: commissionDetail.reason } : null
                ].filter(Boolean)
            };

        } catch (error) {
            console.error('获取订单详情及分成信息失败:', error);
            throw error;
        }
    }
}

const orderStatsService = new OrderStatsService();
export default orderStatsService;