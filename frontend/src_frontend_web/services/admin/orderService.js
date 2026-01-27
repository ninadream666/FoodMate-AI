import { orderApi, API_ENDPOINTS } from './apiConfig';

class OrderService {

    // ============== 订单查询管理 ==============

    // 获取所有订单（管理员视图，支持分页和筛选）
    async getAllOrders(params = {}) {
        try {
            const {
                page = 0,
                size = 20,
                orderNumber,
                userId,
                merchantId,
                status,
                paymentStatus,
                startDate,
                endDate,
                sort = 'orderTime,desc'
            } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort
            });

            if (orderNumber) queryParams.append('orderNumber', orderNumber);
            if (userId) queryParams.append('userId', userId);
            if (merchantId) queryParams.append('merchantId', merchantId);
            if (status) queryParams.append('status', status);
            if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_ALL}?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get all orders failed:', error);
            throw error;
        }
    }

    // 获取订单详情
    async getOrderById(orderId) {
        try {
            const response = await orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_DETAIL}/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Get order detail failed:', error);
            throw error;
        }
    }

    // 获取用户订单
    async getUserOrders(userId, params = {}) {
        try {
            const response = await orderApi.get(`/api/admin/orders/user/${userId}`, { params });
            return response.data;
        } catch (error) {
            console.error('Get user orders failed:', error);
            throw error;
        }
    }

    // 获取商家订单
    async getMerchantOrders(merchantId, params = {}) {
        try {
            const response = await orderApi.get(`/api/admin/orders/merchant/${merchantId}`, { params });
            return response.data;
        } catch (error) {
            console.error('Get merchant orders failed:', error);
            throw error;
        }
    }

    // ============== 订单状态管理 ==============

    // 更新订单状态
    async updateOrderStatus(orderId, status, reason = '') {
        try {
            const response = await orderApi.patch(`${API_ENDPOINTS.ORDERS.ADMIN_STATUS}/${orderId}/status`, {
                status,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Update order status failed:', error);
            throw error;
        }
    }

    // 取消订单
    async cancelOrder(orderId, reason) {
        try {
            const response = await orderApi.post(`/api/admin/orders/${orderId}/cancel`, {
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Cancel order failed:', error);
            throw error;
        }
    }

    // 批量更新订单状态
    async batchUpdateOrderStatus(orderIds, status, reason = '') {
        try {
            const response = await orderApi.patch('/orders/batch-status', {
                orderIds,
                status,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('Batch update order status failed:', error);
            throw error;
        }
    }

    // ============== 订单统计分析 ==============

    // 获取订单统计数据
    async getOrderStats(params = {}) {
        try {
            const { startDate, endDate, groupBy = 'day' } = params;
            const queryParams = new URLSearchParams({ groupBy });

            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await orderApi.get(`${API_ENDPOINTS.ORDERS.ADMIN_STATS}?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get order stats failed:', error);
            throw error;
        }
    }

    // 获取销售趋势数据
    async getSalesTrend(params = {}) {
        try {
            const response = await orderApi.get('/api/admin/orders/sales-trend', { params });
            return response.data;
        } catch (error) {
            console.error('Get sales trend failed:', error);
            throw error;
        }
    }

    // 获取热门商品统计
    async getPopularItems(params = {}) {
        try {
            const response = await orderApi.get('/api/admin/orders/popular-items', { params });
            return response.data;
        } catch (error) {
            console.error('Get popular items failed:', error);
            throw error;
        }
    }

    // 导出订单数据
    async exportOrders(params = {}) {
        try {
            const response = await orderApi.get('/api/admin/orders/export', {
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Export orders failed:', error);
            throw error;
        }
    }
}

const orderService = new OrderService();
export default orderService;