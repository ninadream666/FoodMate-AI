/**
 * 订单服务
 * 对接order-service
 */

import { API_BASE, get, post, getAuthHeaders } from './apiClient';

const API_URL = API_BASE.orders;

/**
 * 创建订单
 * POST /orders
 * @param {object} orderData - 订单数据
 * @param {number} orderData.merchantId - 商家ID
 * @param {Array} orderData.items - 订单项 [{menuItemId, quantity}]
 * @param {number} orderData.addressId - 配送地址ID
 * @param {Array} orderData.couponIds - 使用的优惠券ID列表
 * @param {string} orderData.remark - 备注
 */
export const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('未登录');

  // 调试：打印token信息（不打印完整token，只打印前后部分）
  console.log('Token 存在:', !!token);
  console.log('Token 长度:', token.length);
  console.log('Token 前20字符:', token.substring(0, 20) + '...');

  // 检查token格式（JWT应该有3段，用.分隔）
  const tokenParts = token.split('.');
  console.log('Token 段数:', tokenParts.length, tokenParts.length === 3 ? '(JWT格式正确)' : '(非标准JWT格式)');

  // 尝试解码JWT payload查看过期时间
  if (tokenParts.length === 3) {
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', payload);
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('Token 过期时间:', expDate.toLocaleString());
        console.log('当前时间:', now.toLocaleString());
        console.log('Token 是否过期:', now > expDate ? '已过期!' : '未过期');
      }
    } catch (e) {
      console.warn('无法解码 token payload:', e.message);
    }
  }

  console.log('创建订单请求体:', JSON.stringify(orderData, null, 2));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  console.log('创建订单响应状态:', response.status);
  console.log('响应头:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('创建订单错误响应:', errorText);
    throw new Error(errorText || '创建订单失败');
  }

  return await response.json();
};

/**
 * 获取我的订单列表
 * GET /orders/my-orders
 */
export const getMyOrders = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('未登录');

  const response = await fetch(`${API_URL}/my-orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取订单失败');
  }

  return await response.json();
};

/**
 * 获取订单详情
 * GET /orders/{id}/detail
 */
export const getOrderDetail = async (orderId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('未登录');

  const response = await fetch(`${API_URL}/${orderId}/detail`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取订单详情失败');
  }

  return await response.json();
};

/**
 * 取消订单
 * POST /orders/{id}/cancel
 * @param {number} orderId - 订单ID
 * @param {string} cancelReason - 取消原因
 */
export const cancelOrder = async (orderId, cancelReason) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('未登录');

  const response = await fetch(`${API_URL}/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '取消订单失败');
  }

  return await response.json();
};

/**
 * 支付订单
 * POST /orders/{id}/pay
 */
export const payOrder = async (orderId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('未登录');

  console.log('调用支付API，订单ID:', orderId);

  const response = await fetch(`${API_URL}/${orderId}/pay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('支付API响应状态:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('支付API错误响应:', errorText);
    throw new Error(errorText || '支付失败');
  }

  const result = await response.json();
  console.log('支付API响应数据:', result);
  return result;
};

/**
 * 订单状态映射
 */
export const ORDER_STATUS = {
  PENDING: { label: '待支付', color: 'text-yellow-600' },
  PAID: { label: '已支付', color: 'text-blue-600' },
  CONFIRMED: { label: '已接单', color: 'text-blue-600' },
  ACCEPTED: { label: '已接单', color: 'text-blue-600' },
  PREPARING: { label: '制作中', color: 'text-orange-600' },
  READY: { label: '待配送', color: 'text-orange-600' },
  DELIVERING: { label: '配送中', color: 'text-purple-600' },
  DELIVERED: { label: '已送达', color: 'text-green-600' },
  COMPLETED: { label: '已完成', color: 'text-green-600' },
  CANCELLED: { label: '已取消', color: 'text-gray-400' },
  CANCEL_PENDING: { label: '取消中', color: 'text-yellow-600' },
  REFUNDED: { label: '已退款', color: 'text-gray-400' },
};

/**
 * 获取订单状态文本
 */
export const getOrderStatusText = (status) => {
  if (typeof status === 'object' && status !== null) {
    return status.description || ORDER_STATUS[status.code]?.label || status.code;
  }
  return ORDER_STATUS[status]?.label || status;
};

/**
 * 获取订单状态样式
 */
export const getOrderStatusColor = (status) => {
  if (typeof status === 'object' && status !== null) {
    return ORDER_STATUS[status.code]?.color || 'text-gray-600';
  }
  return ORDER_STATUS[status]?.color || 'text-gray-600';
};

export const orderService = {
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  payOrder,
  ORDER_STATUS,
  getOrderStatusText,
  getOrderStatusColor,
};