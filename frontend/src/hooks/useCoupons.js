// src/hooks/useCoupons.js
import { useState, useEffect, useCallback } from 'react';
// 👇 修复点：使用解构导入，而不是 import * as
import { walletService } from '../services/walletService';
import * as couponUtils from '../utils/couponUtils';

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

    // 获取可用优惠券 (前端过滤)
    const fetchAvailableCoupons = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const result = await walletService.getAllCoupons(userId);
            // 简单的前端过滤逻辑
            const valid = result.filter(c => {
                const now = new Date();
                const isExpired = c.expiresAt && new Date(c.expiresAt) < now;
                const isUsed = c.status === 'USED';
                const isAmountEnough = orderAmount ? (c.minOrderAmount || 0) <= orderAmount : true;
                return !isExpired && !isUsed && isAmountEnough;
            });
            setAvailableCoupons(valid);
        } catch (err) {
            setAvailableCoupons([]);
        } finally {
            setLoading(false);
        }
    }, [userId, orderAmount]);

    // 领取优惠券
    const claimCoupon = useCallback(async (templateId) => {
        if (!userId) return null;
        setLoading(true);
        try {
            const result = await walletService.claimCoupon(templateId, userId);
            await fetchAllCoupons();
            return result;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, fetchAllCoupons]);

    // 初始化
    useEffect(() => {
        fetchAllCoupons();
    }, [fetchAllCoupons]);

    useEffect(() => {
        fetchAvailableCoupons();
    }, [fetchAvailableCoupons]);

    return {
        coupons,
        availableCoupons,
        loading,
        error,
        refreshCoupons: fetchAllCoupons,
        claimCoupon
    };
};