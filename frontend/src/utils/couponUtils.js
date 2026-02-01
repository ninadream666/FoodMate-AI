/**
 * 优惠券验证和计算工具
 * 用于前端验证优惠券可用性和计算优惠金额
 * 基于后端接口文档 v1.0 (2026-01-03) 完善
 * React Native版本 - 使用JavaScript日期处理，移除date-fns依赖
 */

/**
 * 验证优惠券是否可用
 * @param {Object} coupon - 优惠券对象
 * @param {number} orderAmount - 订单金额
 * @returns {Object} 验证结果 { valid: boolean, reason: string, value: number }
 */
export const validateCoupon = (coupon, orderAmount) => {
    // 检查最低消费金额
    if (orderAmount < (coupon.minOrderAmount || 0)) {
        return {
            valid: false,
            reason: `还需¥${((coupon.minOrderAmount || 0) - orderAmount).toFixed(2)}才能使用`,
            value: 0
        };
    }

    // 计算优惠券面值
    let couponValue = 0;
    if (coupon.type === 'PERCENTAGE') {
        couponValue = orderAmount * (coupon.discountValue / 100);
        if (coupon.maxDiscount) {
            couponValue = Math.min(couponValue, coupon.maxDiscount);
        }
    } else {
        couponValue = coupon.discountValue;
    }

    // 检查优惠券面值是否超过订单金额
    if (couponValue >= orderAmount) {
        return {
            valid: false,
            reason: '优惠金额超出订单金额，无法使用',
            value: couponValue
        };
    }

    return {
        valid: true,
        reason: '',
        value: couponValue
    };
};

/**
 * 计算多个优惠券的总优惠金额
 * @param {Array} coupons - 优惠券数组
 * @param {number} orderAmount - 订单金额
 * @returns {Object} 计算结果 { totalDiscount: number, validCoupons: Array, invalidCoupons: Array }
 */
export const calculateCouponsDiscount = (coupons, orderAmount) => {
    let remainingAmount = orderAmount;
    let totalDiscount = 0;
    const validCoupons = [];
    const invalidCoupons = [];

    // 按优惠金额从大到小排序，优先使用高价值优惠券
    const sortedCoupons = [...coupons].sort((a, b) => {
        const aValue = a.type === 'PERCENTAGE'
            ? Math.min(orderAmount * (a.discountValue / 100), a.maxDiscount || Infinity)
            : a.discountValue;
        const bValue = b.type === 'PERCENTAGE'
            ? Math.min(orderAmount * (b.discountValue / 100), b.maxDiscount || Infinity)
            : b.discountValue;
        return bValue - aValue;
    });

    for (const coupon of sortedCoupons) {
        const validation = validateCoupon(coupon, remainingAmount);

        if (validation.valid) {
            // 确保优惠后的金额不为负数
            const actualDiscount = Math.min(validation.value, remainingAmount - 0.01); // 保留至少1分钱

            if (actualDiscount > 0) {
                totalDiscount += actualDiscount;
                remainingAmount -= actualDiscount;
                validCoupons.push({
                    ...coupon,
                    actualDiscount: actualDiscount
                });
            } else {
                invalidCoupons.push({
                    ...coupon,
                    reason: '优惠后金额不能为负数'
                });
            }
        } else {
            invalidCoupons.push({
                ...coupon,
                reason: validation.reason
            });
        }
    }

    return {
        totalDiscount,
        validCoupons,
        invalidCoupons,
        finalAmount: orderAmount - totalDiscount
    };
};

/**
 * 格式化优惠券类型显示文本
 * @param {Object} coupon - 优惠券对象
 * @returns {string} 格式化后的文本
 */
export const formatCouponType = (coupon) => {
    if (coupon.type === 'PERCENTAGE') {
        let text = `${coupon.discountValue}%折扣`;
        if (coupon.maxDiscount) {
            text += ` (最高减¥${coupon.maxDiscount})`;
        }
        return text;
    } else {
        return `减¥${coupon.discountValue}`;
    }
};

/**
 * 格式化优惠券使用条件
 * @param {Object} coupon - 优惠券对象
 * @returns {string} 格式化后的条件文本
 */
export const formatCouponCondition = (coupon) => {
    const conditions = [];

    if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
        conditions.push(`满¥${coupon.minOrderAmount}`);
    }

    if (coupon.validUntil) {
        const expiry = new Date(coupon.validUntil);
        if (expiry > new Date()) {
            conditions.push(`有效期至${expiry.toLocaleDateString()}`);
        }
    }

    return conditions.length > 0 ? conditions.join(' • ') : '无限制';
};

/**
 * 检查优惠券是否即将过期（7天内过期）
 * @param {Object} coupon - 优惠券对象
 * @returns {boolean} 是否即将过期
 */
export const isCouponExpiringSoon = (coupon) => {
    if (!coupon.validUntil) return false;

    const expiry = new Date(coupon.validUntil);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 7 && diffDays > 0;
};

/**
 * 生成优惠券智能推荐说明
 * @param {Object} result - calculateCouponsDiscount 的返回结果
 * @param {number} originalAmount - 原始订单金额
 * @returns {Object} 推荐说明 { title: string, description: string, savings: string }
 */
export const generateRecommendationDescription = (result, originalAmount) => {
    const { totalDiscount, validCoupons, finalAmount } = result;
    const savingsPercentage = ((totalDiscount / originalAmount) * 100).toFixed(1);

    let title = '🤖 AI智能优化结果';
    let description = '';

    if (validCoupons.length === 0) {
        title = '💡 暂无可用优惠券';
        description = '当前订单暂时没有合适的优惠券可使用';
    } else if (validCoupons.length === 1) {
        description = `已为您选择最优优惠券「${validCoupons[0].name}」`;
    } else {
        description = `已为您智能组合 ${validCoupons.length} 张优惠券`;
    }

    const savings = `节省 ${savingsPercentage}%`;

    return {
        title,
        description,
        savings,
        totalDiscount,
        finalAmount,
        validCoupons
    };
};

// ==================== 新增工具函数 (匹配后端接口) ====================

/**
 * 检查优惠券是否过期（基于新的数据结构）
 * @param {Object} coupon - 用户优惠券对象 (UserCouponDTO)
 * @returns {boolean} 是否过期
 */
export const isCouponExpired = (coupon) => {
    if (!coupon || !coupon.expiresAt) return false;
    return new Date() > new Date(coupon.expiresAt);
};

/**
 * 检查优惠券是否可用于指定订单（基于新的数据结构）
 * @param {Object} coupon - 用户优惠券对象 (UserCouponDTO)
 * @param {number} orderTotal - 订单总金额
 * @param {number} merchantId - 商户ID（可选）
 * @returns {Object} 验证结果 { valid: boolean, reason?: string }
 */
export const isCouponApplicable = (coupon, orderTotal, merchantId = null) => {
    if (!coupon || !coupon.couponTemplate) {
        return { valid: false, reason: '优惠券信息无效' };
    }

    // 检查过期
    if (isCouponExpired(coupon)) {
        return { valid: false, reason: '优惠券已过期' };
    }

    // 检查状态
    if (coupon.status !== 'AVAILABLE') {
        return { valid: false, reason: '优惠券不可用' };
    }

    // 检查最低消费金额
    const template = coupon.couponTemplate;
    if (template.minOrderAmount && orderTotal < template.minOrderAmount) {
        return {
            valid: false,
            reason: `订单金额需满${template.minOrderAmount}元`
        };
    }

    // 检查适用商户
    if (merchantId && template.applicableMerchantIds) {
        const merchantIds = template.applicableMerchantIds.split(',').map(id => parseInt(id));
        if (!merchantIds.includes(merchantId)) {
            return { valid: false, reason: '此商户不支持该优惠券' };
        }
    }

    return { valid: true };
};

/**
 * 计算单个优惠券的优惠金额（基于新的数据结构）
 * @param {Object} coupon - 用户优惠券对象 (UserCouponDTO)
 * @param {number} orderTotal - 订单总金额
 * @returns {number} 优惠金额
 */
export const calculateCouponDiscount = (coupon, orderTotal) => {
    if (!coupon || !coupon.couponTemplate) return 0;

    const template = coupon.couponTemplate;

    // 检查是否满足使用条件
    if (template.minOrderAmount && orderTotal < template.minOrderAmount) {
        return 0;
    }

    let discount = 0;

    if (template.type === 'FULL_REDUCTION') {
        // 满减券
        discount = template.discountValue;
    } else if (template.type === 'DISCOUNT') {
        // 折扣券 (discountValue 是折扣率，如 0.8 表示8折)
        discount = orderTotal * (1 - template.discountValue);
    }

    // 应用最高优惠金额限制
    if (template.maxDiscount && discount > template.maxDiscount) {
        discount = template.maxDiscount;
    }

    // 确保优惠金额不超过订单总额
    return Math.min(discount, orderTotal);
};

/**
 * 格式化优惠券面值显示（基于新的数据结构）
 * @param {Object} couponTemplate - 优惠券模板对象
 * @returns {string} 格式化后的面值
 */
export const formatCouponValue = (couponTemplate) => {
    if (!couponTemplate) return '';

    if (couponTemplate.type === 'DISCOUNT') {
        return `${Math.round(couponTemplate.discountValue * 10)}折`;
    }
    return `¥${couponTemplate.discountValue}`;
};

/**
 * 格式化优惠券描述（基于新的数据结构）
 * @param {Object} couponTemplate - 优惠券模板对象
 * @returns {string} 格式化后的描述
 */
export const formatCouponDescription = (couponTemplate) => {
    if (!couponTemplate) return '';

    if (couponTemplate.type === 'FULL_REDUCTION') {
        let desc = `满${couponTemplate.minOrderAmount}减${couponTemplate.discountValue}`;
        if (couponTemplate.maxDiscount && couponTemplate.maxDiscount < couponTemplate.discountValue) {
            desc += `（最高减${couponTemplate.maxDiscount}）`;
        }
        return desc;
    } else if (couponTemplate.type === 'DISCOUNT') {
        let desc = `${Math.round(couponTemplate.discountValue * 10)}折`;
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
 * 获取优惠券状态显示名称
 * @param {string} status - 优惠券状态
 * @returns {string} 状态名称
 */
export const getCouponStatusName = (status) => {
    const statusMap = {
        'AVAILABLE': '可用',
        'USED': '已使用',
        'EXPIRED': '已过期',
    };
    return statusMap[status] || '未知';
};

/**
 * 获取优惠券状态颜色
 * @param {string} status - 优惠券状态
 * @param {boolean} isExpiringSoon - 是否即将过期
 * @returns {string} 颜色值
 */
export const getCouponStatusColor = (status, isExpiringSoon = false) => {
    if (status === 'AVAILABLE') {
        return isExpiringSoon ? '#ff9800' : '#4caf50'; // 橙色（即将过期）或绿色（可用）
    } else if (status === 'USED') {
        return '#9e9e9e'; // 灰色（已使用）
    } else if (status === 'EXPIRED') {
        return '#f44336'; // 红色（已过期）
    }
    return '#9e9e9e'; // 默认灰色
};

/**
 * 检查优惠券组合是否有冲突
 * @param {Array} coupons - 优惠券数组
 * @returns {Object} 验证结果 { valid: boolean, reason?: string, conflicts?: Array }
 */
export const validateCouponCombination = (coupons) => {
    if (!Array.isArray(coupons) || coupons.length === 0) {
        return { valid: true };
    }

    const conflicts = [];

    // 检查是否有不支持叠加的优惠券
    const nonStackable = coupons.filter(c =>
        c.couponTemplate && !c.couponTemplate.stackable
    );

    if (nonStackable.length > 1) {
        conflicts.push({
            type: 'non-stackable',
            message: '选中的优惠券中有多个不支持叠加使用',
            coupons: nonStackable,
        });
    }

    if (nonStackable.length === 1 && coupons.length > 1) {
        conflicts.push({
            type: 'non-stackable-with-others',
            message: '该优惠券不支持与其他优惠券叠加使用',
            coupons: nonStackable,
        });
    }

    // 检查互斥优惠券
    for (let i = 0; i < coupons.length; i++) {
        const coupon1 = coupons[i];
        if (!coupon1.couponTemplate?.exclusiveIds) continue;

        const exclusiveIds = coupon1.couponTemplate.exclusiveIds
            .split(',')
            .map(id => parseInt(id))
            .filter(id => !isNaN(id));

        for (let j = i + 1; j < coupons.length; j++) {
            const coupon2 = coupons[j];
            if (!coupon2.couponTemplate?.id) continue;

            if (exclusiveIds.includes(coupon2.couponTemplate.id)) {
                conflicts.push({
                    type: 'exclusive',
                    message: '选中的优惠券存在互斥关系',
                    coupons: [coupon1, coupon2],
                });
            }
        }
    }

    return {
        valid: conflicts.length === 0,
        conflicts,
        reason: conflicts.length > 0 ? conflicts[0].message : undefined,
    };
};

/**
 * 过滤优惠券
 * @param {Array} coupons - 优惠券数组
 * @param {Object} filters - 过滤条件
 * @returns {Array} 过滤后的优惠券数组
 */
export const filterCoupons = (coupons, filters = {}) => {
    if (!Array.isArray(coupons)) return [];

    return coupons.filter(coupon => {
        // 状态过滤
        if (filters.status && filters.status !== 'ALL' && coupon.status !== filters.status) {
            return false;
        }

        // 订单金额过滤
        if (filters.orderAmount && coupon.couponTemplate) {
            const applicable = isCouponApplicable(coupon, filters.orderAmount);
            if (!applicable.valid) return false;
        }

        // 商户过滤
        if (filters.merchantId && coupon.couponTemplate?.applicableMerchantIds) {
            const merchantIds = coupon.couponTemplate.applicableMerchantIds
                .split(',')
                .map(id => parseInt(id));
            if (!merchantIds.includes(filters.merchantId)) {
                return false;
            }
        }

        // 即将过期过滤
        if (filters.expiringSoon && !isCouponExpiringSoon(coupon)) {
            return false;
        }

        // 类型过滤
        if (filters.type && coupon.couponTemplate?.type !== filters.type) {
            return false;
        }

        return true;
    });
};

/**
 * 格式化优惠券过期时间
 * @param {string} expiresAt - 过期时间
 * @returns {string} 格式化的过期时间
 */
export const formatExpiryTime = (expiresAt) => {
    if (!expiresAt) return '';

    try {
        const expiry = new Date(expiresAt);
        const now = new Date();

        if (expiry < now) {
            return '已过期';
        }

        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return '今天过期';
        } else if (diffDays <= 7) {
            return `${diffDays}天后过期`;
        } else {
            return `${Math.ceil(diffDays / 7)}周后过期`;
        }
    } catch (error) {
        console.warn('时间格式化失败:', error);
        return '时间格式错误';
    }
};