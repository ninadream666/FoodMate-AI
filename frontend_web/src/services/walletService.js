/**
 * 钱包与优惠券服务
 * 对接 marketing-service (端口 8082)
 * 完全匹配后端接口文档 v1.0 (2026-01-03)
 */

import { API_BASE, get, post, getAuthHeaders } from './apiClient';

// 直接使用marketing-service的完整路径
const COUPON_API_BASE = 'http://localhost:8082/api/coupons';

// 模拟钱包数据
const MOCK_WALLET = {
  balance: 128.00,
  currency: '¥'
};

// 模拟优惠券数据
const MOCK_COUPONS = [
  {
    id: 1,
    status: 'AVAILABLE',
    couponTemplate: {
      id: 1,
      name: '新用户专享券',
      type: 'FULL_REDUCTION',
      discountValue: 10,
      minOrderAmount: 30,
      maxDiscount: 10,
      description: '满30减10'
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    status: 'AVAILABLE',
    couponTemplate: {
      id: 2,
      name: '通用优惠券',
      type: 'FULL_REDUCTION',
      discountValue: 5,
      minOrderAmount: 20,
      maxDiscount: 5,
      description: '满20减5'
    },
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// 检查是否应该使用模拟数据
const shouldUseMockData = () => {
  // 在开发环境中，如果后端不可用则使用模拟数据
  return process.env.NODE_ENV === 'development';
};

/**
 * 获取钱包余额
 */
export const getBalance = async () => {
  // 模拟100ms网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_WALLET;
};

// ==================== 领取优惠券 ====================
/**
 * 领取优惠券
 * POST /api/coupons/issue
 * @param {number} couponTemplateId - 优惠券模板ID
 * @param {number} userId - 用户ID（可选，从认证上下文获取）
 */
export const claimCoupon = async (couponTemplateId, userId = null) => {
  try {
    const body = { couponTemplateId };
    if (userId) {
      body.userId = userId;
    }

    const response = await fetch(`${COUPON_API_BASE}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '领取优惠券失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('领取优惠券失败:', error);
    throw error;
  }
};

// ==================== 查询用户可用优惠券 ====================
/**
 * 获取用户可用优惠券
 * GET /api/coupons/user/{userId}/available?orderAmount=100
 * @param {number} userId - 用户ID
 * @param {number} orderAmount - 订单金额（可选，过滤满足最低使用条件的优惠券）
 */
export const getAvailableCoupons = async (userId, orderAmount = null) => {
  try {
    let url = `${COUPON_API_BASE}/user/${userId}/available`;
    if (orderAmount !== null) {
      url += `?orderAmount=${orderAmount}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('获取可用优惠券失败:', errorData?.message || '请求失败');

      // 在开发环境中返回模拟数据
      if (shouldUseMockData()) {
        console.info('📦 使用模拟优惠券数据');
        return MOCK_COUPONS.filter(coupon => {
          if (!orderAmount || !coupon.couponTemplate.minOrderAmount) return true;
          return orderAmount >= coupon.couponTemplate.minOrderAmount;
        });
      }

      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.warn('获取可用优惠券失败:', error.message);

    // 在开发环境中返回模拟数据
    if (shouldUseMockData()) {
      console.info('📦 使用模拟优惠券数据');
      return MOCK_COUPONS.filter(coupon => {
        if (!orderAmount || !coupon.couponTemplate.minOrderAmount) return true;
        return orderAmount >= coupon.couponTemplate.minOrderAmount;
      });
    }

    return [];
  }
};

// ==================== 查询用户所有优惠券 ====================
/**
 * 获取用户所有优惠券，包括已使用、已过期
 * GET /api/coupons/user/{userId}/all
 * @param {number} userId - 用户ID
 */
export const getAllCoupons = async (userId) => {
  try {
    const response = await fetch(`${COUPON_API_BASE}/user/${userId}/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('获取优惠券列表失败:', errorData?.message || '请求失败');

      // 在开发环境中返回模拟数据
      if (shouldUseMockData()) {
        console.info('📦 使用模拟优惠券数据');
        return MOCK_COUPONS;
      }

      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.warn('获取优惠券列表失败:', error.message);

    // 在开发环境中返回模拟数据
    if (shouldUseMockData()) {
      console.info('📦 使用模拟优惠券数据');
      return MOCK_COUPONS;
    }

    return [];
  }
};

// ==================== 获取优惠券详情 ====================
/**
 * 获取优惠券详情
 * GET /api/coupons/{couponId}
 * @param {number} couponId - 用户优惠券ID
 */
export const getCouponDetail = async (couponId) => {
  try {
    const response = await fetch(`${COUPON_API_BASE}/${couponId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '获取优惠券详情失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('获取优惠券详情失败:', error);
    throw error;
  }
};

// ==================== 计算最优优惠券组合 ====================
/**
 * 计算最优优惠券组合
 * POST /api/coupons/calculate-best
 * @param {object} data - 计算参数
 * @param {number} data.userId - 用户ID
 * @param {number} data.orderTotal - 订单总金额
 * @param {number} data.merchantId - 商户ID（可选）
 * @param {Array} data.orderItems - 订单项列表（可选）
 */
export const calculateBestCoupons = async (data) => {
  try {
    const response = await fetch(`${COUPON_API_BASE}/calculate-best`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '计算最优优惠券失败');
    }

    const result = await response.json();

    // 转换返回数据格式以匹配前端期望的字段名
    if (result.data) {
      return {
        recommendedCoupons: result.data.selectedCouponIds || [],
        totalDiscount: result.data.totalDiscount || 0,
        finalAmount: result.data.finalPrice || data.orderTotal,
        originalPrice: result.data.originalPrice || data.orderTotal,
        description: result.data.description || '',
        success: result.data.success || false,
      };
    }

    return {
      recommendedCoupons: [],
      totalDiscount: 0,
      finalAmount: data.orderTotal,
    };
  } catch (error) {
    console.warn('优惠券计算服务不可用:', error.message);
    return {
      recommendedCoupons: [],
      totalDiscount: 0,
      finalAmount: data.orderTotal,
    };
  }
};

// ==================== 检查优惠券使用条件 ====================
/**
 * 检查优惠券使用条件
 * GET /api/coupons/{couponId}/check-amount?orderAmount=100
 * @param {number} couponId - 用户优惠券ID
 * @param {number} orderAmount - 订单金额
 */
export const checkCouponUsage = async (couponId, orderAmount) => {
  try {
    const response = await fetch(`${COUPON_API_BASE}/${couponId}/check-amount?orderAmount=${orderAmount}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '检查优惠券使用条件失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('检查优惠券使用条件失败:', error);
    throw error;
  }
};

// ==================== 验证优惠券组合 ====================
/**
 * 验证优惠券组合
 * POST /api/coupons/validate-combination
 * @param {Array<number>} couponIds - 优惠券ID数组
 */
export const validateCouponCombination = async (couponIds) => {
  try {
    const response = await fetch(`${COUPON_API_BASE}/validate-combination`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(couponIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '验证优惠券组合失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('验证优惠券组合失败:', error);
    throw error;
  }
};

// ==================== 核销优惠券 ====================
/**
 * 核销优惠券（订单服务调用）
 * POST /api/coupons/{couponId}/use
 * @param {number} couponId - 用户优惠券ID
 * @param {number} orderId - 订单ID
 * @param {string} remark - 核销备注（可选）
 */
export const useCoupon = async (couponId, orderId, remark = null) => {
  try {
    const body = { orderId };
    if (couponId) body.couponId = couponId;
    if (remark) body.remark = remark;

    const response = await fetch(`${COUPON_API_BASE}/${couponId}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '核销优惠券失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('核销优惠券失败:', error);
    throw error;
  }
};

// ==================== 回滚优惠券 ====================
/**
 * 回滚优惠券（订单取消时调用）
 * POST /api/coupons/{couponId}/rollback
 * @param {number} couponId - 用户优惠券ID
 * @param {number} orderId - 订单ID（可选）
 * @param {string} reason - 回滚原因（可选）
 */
export const rollbackCoupon = async (couponId, orderId = null, reason = null) => {
  try {
    const body = {};
    if (couponId) body.couponId = couponId;
    if (orderId) body.orderId = orderId;
    if (reason) body.reason = reason;

    const response = await fetch(`${COUPON_API_BASE}/${couponId}/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '回滚优惠券失败');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('回滚优惠券失败:', error);
    throw error;
  }
};

// ==================== 获取优惠券模板列表 ====================
/**
 * 获取优惠券模板列表
 * GET /api/coupons/templates?enabled=true
 * @param {boolean} enabled - 筛选启用状态（可选）
 */
export const getCouponTemplates = async (enabled = null) => {
  try {
    let url = `${COUPON_API_BASE}/templates`;
    if (enabled !== null) {
      url += `?enabled=${enabled}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '获取优惠券模板失败');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.warn('获取优惠券模板失败:', error.message);
    return [];
  }
};

// ==================== 工具函数 ====================

/**
 * 优惠券类型映射
 */
export const COUPON_TYPE = {
  FULL_REDUCTION: '满减券',
  DISCOUNT: '折扣券',
};

/**
 * 优惠券状态映射
 */
export const COUPON_STATUS = {
  AVAILABLE: '可用',
  USED: '已使用',
  EXPIRED: '已过期',
};

/**
 * 格式化优惠券显示
 * @param {Object} couponTemplate - 优惠券模板对象
 */
export const formatCouponValue = (couponTemplate) => {
  if (couponTemplate.type === 'DISCOUNT') {
    return `${couponTemplate.discountValue * 10}折`;
  }
  return `¥${couponTemplate.discountValue}`;
};

/**
 * 格式化优惠券类型描述
 * @param {Object} couponTemplate - 优惠券模板对象
 */
export const formatCouponDescription = (couponTemplate) => {
  if (couponTemplate.type === 'FULL_REDUCTION') {
    let desc = `满${couponTemplate.minOrderAmount}减${couponTemplate.discountValue}`;
    if (couponTemplate.maxDiscount && couponTemplate.maxDiscount < couponTemplate.discountValue) {
      desc += `（最高减${couponTemplate.maxDiscount}）`;
    }
    return desc;
  } else if (couponTemplate.type === 'DISCOUNT') {
    let desc = `${couponTemplate.discountValue * 10}折`;
    if (couponTemplate.maxDiscount) {
      desc += `（最高减${couponTemplate.maxDiscount}）`;
    }
    if (couponTemplate.minOrderAmount > 0) {
      desc += `，满${couponTemplate.minOrderAmount}可用`;
    }
    return desc;
  }
  return couponTemplate.name || '优惠券';
};

/**
 * 检查优惠券是否过期
 * @param {Object} coupon - 用户优惠券对象
 */
export const isCouponExpired = (coupon) => {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
};

/**
 * 检查优惠券是否可用于订单
 * @param {Object} coupon - 用户优惠券对象
 * @param {number} orderTotal - 订单总金额
 */
export const isCouponApplicable = (coupon, orderTotal) => {
  if (isCouponExpired(coupon)) return false;
  if (coupon.status !== 'AVAILABLE') return false;
  if (coupon.couponTemplate && coupon.couponTemplate.minOrderAmount && orderTotal < coupon.couponTemplate.minOrderAmount) {
    return false;
  }
  return true;
};

/**
 * 检查优惠券是否即将过期（7天内）
 * @param {Object} coupon - 用户优惠券对象
 */
export const isCouponExpiringSoon = (coupon) => {
  if (!coupon.expiresAt) return false;

  const expiry = new Date(coupon.expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays <= 7 && diffDays > 0;
};

/**
 * 获取优惠券列表
 * 根据用户ID从localStorage获取
 */
export const getCoupons = async () => {
  // 尝试从 localStorage 获取用户信息
  const userStr = localStorage.getItem('user');
  let userId = null;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
    } catch (e) {
      console.warn('解析用户信息失败:', e);
    }
  }

  if (userId) {
    return getAllCoupons(userId);
  }

  // 没有用户ID时返回空数组
  console.warn('未找到用户ID，无法获取优惠券');
  return [];
};

// ==================== 统一导出 ====================
export const walletService = {
  // 钱包相关
  getBalance,

  // 优惠券领取和查询
  claimCoupon,
  getAvailableCoupons,
  getAllCoupons,
  getCoupons,
  getCouponDetail,
  getCouponTemplates,

  // 优惠券计算和验证
  calculateBestCoupons,
  checkCouponUsage,
  validateCouponCombination,

  // 优惠券核销和回滚
  useCoupon,
  rollbackCoupon,

  // 工具函数
  COUPON_TYPE,
  COUPON_STATUS,
  formatCouponValue,
  formatCouponDescription,
  isCouponExpired,
  isCouponApplicable,
  isCouponExpiringSoon,
};

export default walletService;