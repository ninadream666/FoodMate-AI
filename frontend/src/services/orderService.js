// src/services/orderService.js
import api from './apiClient';

// 订单状态常量
export const ORDER_STATUS = {
    PENDING: { label: '待支付', color: '#e6a23c' },
    PAID: { label: '已支付', color: '#409eff' },
    CONFIRMED: { label: '已接单', color: '#409eff' },
    ACCEPTED: { label: '已接单', color: '#409eff' },
    PREPARING: { label: '制作中', color: '#e6a23c' },
    READY: { label: '待配送', color: '#e6a23c' },
    DELIVERING: { label: '配送中', color: '#909399' },
    DELIVERED: { label: '已送达', color: '#67c23a' },
    COMPLETED: { label: '已完成', color: '#67c23a' },
    CANCELLED: { label: '已取消', color: '#909399' },
    CANCEL_PENDING: { label: '取消中', color: '#e6a23c' },
    REFUNDED: { label: '已退款', color: '#909399' },
};

export const orderService = {
    // 创建订单
    createOrder: async (orderData) => {
        return await api.post('orders', '', orderData);
    },

    // 支付订单
    payOrder: async (orderId) => {
        return await api.post('orders', `/${orderId}/pay`);
    },

    // 获取我的订单列表
    getMyOrders: async () => {
        return await api.get('orders', '/my-orders');
    },

    // 获取订单详情
    getOrderDetail: async (orderId) => {
        return await api.get('orders', `/${orderId}/detail`);
    },

    // 取消订单
    cancelOrder: async (orderId, cancelReason) => {
        return await api.post('orders', `/${orderId}/cancel`, { cancelReason });
    },

    // 辅助方法：获取状态文本
    getStatusLabel: (status) => {
        // 兼容后端返回的对象 { code: 'PAID' } 或字符串 'PAID'
        const code = typeof status === 'object' && status !== null ? status.code : status;
        return ORDER_STATUS[code]?.label || code;
    },

    // 辅助方法：获取状态颜色
    getStatusColor: (status) => {
        const code = typeof status === 'object' && status !== null ? status.code : status;
        return ORDER_STATUS[code]?.color || '#999';
    },

    // 辅助方法：判断是否可取消
    // PENDING/PAID: 直接取消退款；CONFIRMED/PREPARING: 需商家审批
    canCancel: (status) => {
        const code = typeof status === 'object' && status !== null ? status.code : status;
        return ['PENDING', 'PAID', 'CONFIRMED', 'PREPARING'].includes(code);
    }
};