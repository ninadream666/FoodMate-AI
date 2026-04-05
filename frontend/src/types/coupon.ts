/**
 * 优惠券相关的TypeScript类型定义
 * 基于后端接口文档v1.0 (2026-01-03)
 */

// ==================== 基础数据类型 ====================

/**
 * 优惠券模板DTO
 */
export interface CouponTemplateDTO {
    id: number;                       // 模板ID
    name: string;                     // 优惠券名称
    description?: string;             // 描述
    type: 'FULL_REDUCTION' | 'DISCOUNT';  // 类型：满减券|折扣券
    minOrderAmount: number;           // 最低订单金额
    discountValue: number;            // 折扣值
    maxDiscount?: number;             // 最高优惠金额
    totalQuantity: number;            // 发放总量
    issuedQuantity: number;           // 已发放数量
    validFrom: string;                // 有效期开始时间ISO8601
    validUntil: string;               // 有效期结束时间ISO8601
    enabled: boolean;                 // 是否启用
    stackable: boolean;               // 是否可叠加使用
    exclusiveIds?: string;            // 互斥优惠券IDs（逗号分隔）
    applicableMerchantIds?: string;   // 适用商户IDs（逗号分隔）
    createdAt: string;                // 创建时间ISO8601
    updatedAt: string;                // 更新时间ISO8601
}

/**
 * 用户优惠券DTO
 */
export interface UserCouponDTO {
    id: number;                       // 优惠券实例ID
    userId: number;                   // 用户ID
    couponTemplateId: number;         // 优惠券模板ID
    status: 'AVAILABLE' | 'USED' | 'EXPIRED';  // 状态：可用|已使用|已过期
    orderId?: number;                 // 关联订单ID（已使用时有值）
    obtainedAt: string;               // 领取时间ISO8601
    usedAt?: string;                  // 使用时间ISO8601
    expiresAt: string;                // 过期时间ISO8601
    createdAt: string;                // 创建时间ISO8601
    updatedAt: string;                // 更新时间ISO8601
    couponTemplate: CouponTemplateDTO; // 关联的优惠券模板信息
}

// ==================== 请求参数类型 ====================

/**
 * 领取优惠券请求
 */
export interface ClaimCouponRequest {
    couponTemplateId: number;         // 优惠券模板ID
    userId?: number;                  // 用户ID（可选，从认证上下文获取）
}

/**
 * 计算最优优惠券组合请求
 */
export interface CalculateBestCouponsRequest {
    userId: number;                   // 用户ID
    orderTotal: number;               // 订单总金额
    merchantId?: number;              // 商户ID（可选）
    orderItems?: OrderItem[];         // 订单项列表（可选）
}

/**
 * 订单项
 */
export interface OrderItem {
    itemId: number;                   // 商品ID
    name?: string;                    // 商品名称
    price: number;                    // 商品单价
    quantity: number;                 // 数量
}

/**
 * 核销优惠券请求
 */
export interface UseCouponRequest {
    couponId?: number;                // 用户优惠券ID（可选，从路径获取）
    orderId: number;                  // 订单ID
    remark?: string;                  // 核销备注
}

/**
 * 回滚优惠券请求
 */
export interface RollbackCouponRequest {
    couponId?: number;                // 用户优惠券ID（可选，从路径获取）
    orderId?: number;                 // 订单ID
    reason?: string;                  // 回滚原因
}

// ==================== 响应数据类型 ====================

/**
 * API统一响应格式
 */
export interface ApiResponse<T = any> {
    code: number;                     // 响应码：200成功，其他为错误
    message: string;                  // 响应消息
    data: T | null;                   // 响应数据
}

/**
 * 计算最优优惠券组合响应
 */
export interface CalculateBestCouponsResponse {
    selectedCouponIds: number[];      // 推荐的优惠券ID列表
    totalDiscount: number;            // 总优惠金额
    finalPrice: number;               // 优惠后的价格
    originalPrice: number;            // 原始价格
    description: string;              // 优惠方案说明
    success: boolean;                 // 是否成功找到最优方案
}

/**
 * 检查优惠券使用条件响应
 */
export interface CheckCouponUsageResponse {
    couponId: number;                 // 优惠券ID
    orderAmount: number;              // 订单金额
    canUse: boolean;                  // 是否可用
    reason?: string;                  // 不可用原因（当canUse为false时）
}

/**
 * 验证优惠券组合响应
 */
export interface ValidateCombinationResponse {
    valid: boolean;                   // 组合是否有效
    message: string;                  // 验证消息
}

// ==================== 前端业务类型 ====================

/**
 * 优惠券选择器状态
 */
export interface CouponSelectorState {
    availableCoupons: UserCouponDTO[];     // 可用优惠券列表
    selectedCouponIds: number[];           // 选中的优惠券ID列表
    bestCombination: CalculateBestCouponsResponse | null;  // 最优组合方案
    loading: boolean;                      // 加载状态
    error: string | null;                  // 错误信息
}

/**
 * 优惠券卡片显示状态
 */
export interface CouponCardState {
    coupon: UserCouponDTO;                 // 优惠券数据
    isSelected: boolean;                   // 是否被选中
    isApplicable: boolean;                 // 是否可用
    isExpiringSoon: boolean;               // 是否即将过期
    displayValue: string;                  // 显示的优惠价值
    displayDescription: string;            // 显示的描述
    statusText: string;                    // 状态文本
    statusColor: string;                   // 状态颜色
}

/**
 * 优惠券过滤条件
 */
export interface CouponFilterOptions {
    status?: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'ALL';  // 状态过滤
    orderAmount?: number;                  // 按订单金额过滤
    merchantId?: number;                   // 按商户过滤
    expiringSoon?: boolean;                // 仅显示即将过期的
}

// ==================== 工具类型 ====================

/**
 * 优惠券类型枚举
 */
export const CouponType = {
    FULL_REDUCTION: 'FULL_REDUCTION' as const,
    DISCOUNT: 'DISCOUNT' as const,
} as const;

/**
 * 优惠券状态枚举
 */
export const CouponStatus = {
    AVAILABLE: 'AVAILABLE' as const,
    USED: 'USED' as const,
    EXPIRED: 'EXPIRED' as const,
} as const;

/**
 * 优惠券验证结果
 */
export interface CouponValidationResult {
    valid: boolean;                        // 是否有效
    reason: string;                        // 验证结果说明
    value: number;                         // 优惠券面值
}

/**
 * 优惠券组合计算结果
 */
export interface CouponsCalculationResult {
    totalDiscount: number;                 // 总优惠金额
    validCoupons: Array<UserCouponDTO & { actualDiscount: number }>; // 有效优惠券及实际优惠金额
    invalidCoupons: Array<UserCouponDTO & { reason: string }>;       // 无效优惠券及原因
    finalAmount: number;                   // 最终订单金额
}

// ==================== React Hook类型 ====================

/**
 * useCoupons Hook返回类型
 */
export interface UseCouponsResult {
    // 数据
    coupons: UserCouponDTO[];
    availableCoupons: UserCouponDTO[];
    selectedCoupons: UserCouponDTO[];
    bestCombination: CalculateBestCouponsResponse | null;

    // 状态
    loading: boolean;
    error: string | null;

    // 操作
    refreshCoupons: () => Promise<void>;
    selectCoupon: (couponId: number) => void;
    unselectCoupon: (couponId: number) => void;
    toggleCoupon: (couponId: number) => void;
    useBestCombination: () => void;
    calculateBest: (orderTotal: number) => Promise<void>;

    // 验证
    validateSelection: () => Promise<boolean>;
    checkCouponUsage: (couponId: number, orderAmount: number) => Promise<boolean>;
}

/**
 * useCouponTemplates Hook返回类型
 */
export interface UseCouponTemplatesResult {
    // 数据
    templates: CouponTemplateDTO[];

    // 状态
    loading: boolean;
    error: string | null;

    // 操作
    refreshTemplates: () => Promise<void>;
    claimCoupon: (templateId: number) => Promise<UserCouponDTO>;
}

// ==================== 导出所有类型 ====================

// 默认导出常用类型
export default {
    CouponType,
    CouponStatus,
};