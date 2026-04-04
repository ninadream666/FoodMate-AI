/**
 * 优惠券相关的 React Hook
 * 提供统一的优惠券数据管理和操作接口
 * 2026-01-03 v1.0
 */

import { useState, useEffect, useCallback } from 'react';
import * as walletService from '../services/walletService';
import * as couponUtils from '../utils/couponUtils';

/**
 * 用户优惠券管理 Hook
 * @param {number} userId - 用户ID
 * @param {number} orderAmount - 订单金额（用于过滤可用优惠券）
 * @param {number} merchantId - 商户ID（可选）
 */
export const useCoupons = (userId, orderAmount = null, merchantId = null) => {
    const [coupons, setCoupons] = useState([]);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [selectedCouponIds, setSelectedCouponIds] = useState([]);
    const [bestCombination, setBestCombination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 获取用户所有优惠券
    const fetchAllCoupons = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await walletService.getAllCoupons(userId);
            setCoupons(result);
        } catch (err) {
            setError(err.message);
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // 获取可用优惠券
    const fetchAvailableCoupons = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await walletService.getAvailableCoupons(userId, orderAmount);
            setAvailableCoupons(result);
        } catch (err) {
            setError(err.message);
            setAvailableCoupons([]);
        } finally {
            setLoading(false);
        }
    }, [userId, orderAmount]);

    // 计算最优优惠券组合
    const calculateBestCombination = useCallback(async () => {
        if (!userId || !orderAmount) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await walletService.calculateBestCoupons({
                userId,
                orderTotal: orderAmount,
                merchantId,
            });
            setBestCombination(result);
            return result;
        } catch (err) {
            setError(err.message);
            setBestCombination(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId, orderAmount, merchantId]);

    // 领取优惠券
    const claimCoupon = useCallback(async (templateId) => {
        if (!userId) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await walletService.claimCoupon(templateId, userId);
            // 领取成功后刷新优惠券列表
            await fetchAllCoupons();
            await fetchAvailableCoupons();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, fetchAllCoupons, fetchAvailableCoupons]);

    // 选择/取消选择优惠券
    const toggleCouponSelection = useCallback((couponId) => {
        setSelectedCouponIds(prev => {
            if (prev.includes(couponId)) {
                return prev.filter(id => id !== couponId);
            } else {
                return [...prev, couponId];
            }
        });
    }, []);

    // 清空选择
    const clearSelection = useCallback(() => {
        setSelectedCouponIds([]);
    }, []);

    // 使用最优组合
    const applyBestCombination = useCallback(() => {
        if (bestCombination && bestCombination.recommendedCoupons) {
            setSelectedCouponIds(bestCombination.recommendedCoupons);
        }
    }, [bestCombination]);

    // 验证选中的优惠券组合
    const validateSelection = useCallback(async () => {
        if (selectedCouponIds.length === 0) return { valid: true };

        try {
            const result = await walletService.validateCouponCombination(selectedCouponIds);
            return result;
        } catch (err) {
            return { valid: false, reason: err.message };
        }
    }, [selectedCouponIds]);

    // 获取选中的优惠券详情
    const selectedCoupons = availableCoupons.filter(coupon =>
        selectedCouponIds.includes(coupon.id)
    );

    // 计算选中优惠券的总优惠金额
    const calculateSelectedDiscount = useCallback(() => {
        if (!orderAmount || selectedCoupons.length === 0) return 0;

        return selectedCoupons.reduce((total, coupon) => {
            return total + couponUtils.calculateCouponDiscount(coupon, orderAmount);
        }, 0);
    }, [selectedCoupons, orderAmount]);

    // 初始化时获取数据
    useEffect(() => {
        fetchAllCoupons();
    }, [fetchAllCoupons]);

    useEffect(() => {
        fetchAvailableCoupons();
    }, [fetchAvailableCoupons]);

    return {
        // 数据
        coupons,
        availableCoupons,
        selectedCoupons,
        selectedCouponIds,
        bestCombination,

        // 状态
        loading,
        error,

        // 计算结果
        selectedDiscount: calculateSelectedDiscount(),

        // 操作
        refreshCoupons: fetchAllCoupons,
        refreshAvailableCoupons: fetchAvailableCoupons,
        calculateBestCombination,
        claimCoupon,
        toggleCouponSelection,
        clearSelection,
        applyBestCombination,
        validateSelection,
    };
};

/**
 * 优惠券模板管理 Hook
 */
export const useCouponTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTemplates = useCallback(async (enabledOnly = true) => {
        setLoading(true);
        setError(null);

        try {
            const result = await walletService.getCouponTemplates(enabledOnly);
            setTemplates(result);
        } catch (err) {
            setError(err.message);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    return {
        templates,
        loading,
        error,
        refreshTemplates: fetchTemplates,
    };
};

/**
 * 优惠券智能推荐 Hook
 * @param {number} userId - 用户ID
 * @param {number} orderAmount - 订单金额
 * @param {number} merchantId - 商户ID（可选）
 */
export const useCouponRecommendation = (userId, orderAmount, merchantId = null) => {
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getRecommendation = useCallback(async () => {
        if (!userId || !orderAmount) return;

        setLoading(true);
        setError(null);

        try {
            const result = await walletService.calculateBestCoupons({
                userId,
                orderTotal: orderAmount,
                merchantId,
            });

            // 生成推荐说明
            const description = couponUtils.generateRecommendationDescription(result, orderAmount);

            setRecommendation({
                ...result,
                description,
            });
        } catch (err) {
            setError(err.message);
            setRecommendation(null);
        } finally {
            setLoading(false);
        }
    }, [userId, orderAmount, merchantId]);

    useEffect(() => {
        getRecommendation();
    }, [getRecommendation]);

    return {
        recommendation,
        loading,
        error,
        refresh: getRecommendation,
    };
};

/**
 * 优惠券过滤和排序 Hook
 * @param {Array} coupons - 优惠券数组
 * @param {Object} defaultFilters - 默认过滤条件
 */
export const useCouponFilter = (coupons, defaultFilters = {}) => {
    const [filters, setFilters] = useState(defaultFilters);
    const [sortBy, setSortBy] = useState('expiresAt');
    const [sortOrder, setSortOrder] = useState('asc');

    const filteredCoupons = couponUtils.filterCoupons(coupons, filters);
    const sortedCoupons = couponUtils.sortCoupons(filteredCoupons, sortBy, sortOrder);

    return {
        coupons: sortedCoupons,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        updateFilter: (key, value) => {
            setFilters(prev => ({ ...prev, [key]: value }));
        },
    };
};

/**
 * 优惠券验证Hook
 * @param {Object} coupon - 优惠券对象
 * @param {number} orderAmount - 订单金额
 */
export const useCouponValidation = (coupon, orderAmount) => {
    const [validation, setValidation] = useState({ valid: true });

    useEffect(() => {
        if (!coupon || !orderAmount) {
            setValidation({ valid: true });
            return;
        }

        const result = couponUtils.isCouponApplicable(coupon, orderAmount);
        setValidation(result);
    }, [coupon, orderAmount]);

    return validation;
};

export default {
    useCoupons,
    useCouponTemplates,
    useCouponRecommendation,
    useCouponFilter,
    useCouponValidation,
};