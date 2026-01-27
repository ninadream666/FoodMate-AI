// JavaScript类型定义文件 - 平台端数据模型
// 使用 JSDoc 注释提供类型提示，避免TypeScript语法错误

// ============== 认证相关 ==============

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {number} id  
 * @property {string} username
 * @property {'admin'|'merchant'|'customer'} role
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

// ============== 平台服务相关 ==============

/**
 * @typedef {Object} PlatformServiceDTO
 * @property {number} id
 * @property {string} serviceCode
 * @property {string} serviceName
 * @property {'PAYMENT'|'DELIVERY'|'MARKETING'|'DATA_ANALYTICS'} category
 * @property {string} categoryName
 * @property {string} description
 * @property {'PERCENTAGE'|'FIXED'|'TIERED'} feeType
 * @property {number} feeValue
 * @property {string} feeDisplay
 * @property {'MONTHLY'|'WEEKLY'|'DAILY'} billingCycle
 * @property {number} minOrderAmount
 * @property {boolean} isMandatory
 * @property {'ACTIVE'|'INACTIVE'|'DRAFT'} status
 * @property {string} statusText
 * @property {number} subscriptionCount
 * @property {number} monthlyRevenue
 * @property {string} lastUpdated
 * @property {string} createdAt
 * @property {string} updatedAt
 */

// ============== 结算相关 ==============

/**
 * @typedef {Object} MerchantSettlementDTO
 * @property {number} id
 * @property {string} settlementNo
 * @property {number} merchantId
 * @property {string} merchantName
 * @property {'MONTHLY'|'WEEKLY'|'DAILY'} settlementType
 * @property {string} periodStart
 * @property {string} periodEnd
 * @property {string} periodDisplay
 * @property {number} totalOrderCount
 * @property {number} totalOrderAmount
 * @property {number} totalCommission
 * @property {number} adjustmentAmount
 * @property {string} adjustmentReason
 * @property {number} netIncome
 * @property {'PENDING_CONFIRM'|'CONFIRMED'|'PAID'|'CANCELLED'} status
 * @property {string} confirmDeadline
 * @property {string} confirmedAt
 * @property {string} paidAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} CommissionRecordDTO
 * @property {number} id
 * @property {string} orderNumber
 * @property {number} orderId
 * @property {number} merchantId
 * @property {number} serviceId
 * @property {string} serviceName
 * @property {number} orderAmount
 * @property {number} commissionRate
 * @property {number} commissionAmount
 * @property {'CALCULATED'|'SETTLED'|'PAID'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SettlementAdjustment
 * @property {number} amount
 * @property {string} reason
 * @property {string} type
 * @property {string} operator
 */

// ============== 商家相关 ==============

/**
 * @typedef {Object} MerchantDTO
 * @property {number} id
 * @property {string} name
 * @property {string} contactPerson
 * @property {string} phone
 * @property {string} email
 * @property {string} address
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'SUSPENDED'} status
 * @property {string} businessLicense
 * @property {number} rating
 * @property {number} totalOrders
 * @property {number} totalRevenue
 * @property {string} createdAt
 * @property {string} updatedAt
 */

// ============== 用户相关 ==============

/**
 * @typedef {Object} UserDTO
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} phone
 * @property {string} nickname
 * @property {string} avatar
 * @property {'ACTIVE'|'INACTIVE'|'SUSPENDED'} status
 * @property {number} creditScore
 * @property {number} totalOrders
 * @property {number} totalSpent
 * @property {string} lastLoginTime
 * @property {string} registrationTime
 * @property {string} createdAt
 * @property {string} updatedAt
 */

// ============== 订单相关 ==============

/**
 * @typedef {Object} OrderDTO
 * @property {string} id
 * @property {number} userId
 * @property {string} username
 * @property {number} merchantId
 * @property {string} merchantName
 * @property {Object} status - 订单状态对象
 * @property {string} status.code - 状态代码
 * @property {string} status.description - 状态描述
 * @property {number} totalAmount
 * @property {number} discountAmount
 * @property {number} deliveryFee
 * @property {number} actualAmount
 * @property {Object|null} paymentMethod - 支付方式对象（可为null）
 * @property {string} paymentMethod.code - 支付方式代码
 * @property {string} paymentMethod.description - 支付方式描述
 * @property {string} paymentTransactionId - 支付交易ID
 * @property {string} paymentChannel - 支付渠道
 * @property {string} cancelReason - 取消原因
 * @property {string} cancelStatus - 取消状态
 * @property {number} refundAmount - 退款金额
 * @property {string} refundApprovedAt - 退款批准时间
 * @property {string} deliveryAddress
 * @property {string} contactPhone
 * @property {string} remark
 * @property {string} orderTime
 * @property {string} estimatedDeliveryTime
 * @property {string} actualDeliveryTime
 * @property {string} paidAt - 支付完成时间
 * @property {OrderItemDTO[]} items
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} OrderItemDTO
 * @property {number} id
 * @property {string} orderId
 * @property {string} itemName
 * @property {number} price
 * @property {number} quantity
 * @property {number} subtotal
 */

// ============== 营销相关 ==============

/**
 * @typedef {Object} CouponDTO
 * @property {number} id
 * @property {number} templateId
 * @property {string} templateName
 * @property {string} couponCode
 * @property {'PERCENTAGE'|'FIXED'} discountType
 * @property {number} discountValue
 * @property {number} minOrderAmount
 * @property {number} maxDiscountAmount
 * @property {'UNUSED'|'USED'|'EXPIRED'} status
 * @property {number} userId
 * @property {string} username
 * @property {string} issueDate
 * @property {string} expiryDate
 * @property {string} usedDate
 * @property {string} orderId
 */

/**
 * @typedef {Object} CouponTemplateDTO
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {'PERCENTAGE'|'FIXED'} discountType
 * @property {number} discountValue
 * @property {number} minOrderAmount
 * @property {number} maxDiscountAmount
 * @property {number} totalCount
 * @property {number} usedCount
 * @property {number} remainingCount
 * @property {'ACTIVE'|'INACTIVE'|'EXPIRED'} status
 * @property {string} validFrom
 * @property {string} validTo
 * @property {string} createdAt
 */

// ============== API响应格式 ==============

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success
 * @property {string} message
 * @property {T} data
 * @property {number} code
 */

/**
 * @typedef {Object} PageResult
 * @template T
 * @property {T[]} list
 * @property {number} total
 * @property {number} pageNum
 * @property {number} pageSize
 * @property {number} pages
 */

// ============== 查询参数 ==============

/**
 * @typedef {Object} PageRequest
 * @property {number} pageNum
 * @property {number} pageSize
 */

/**
 * @typedef {Object} SettlementQueryParams
 * @property {number} pageNum
 * @property {number} pageSize
 * @property {number} [merchantId]
 * @property {'PENDING_CONFIRM'|'CONFIRMED'|'PAID'|'CANCELLED'} [status]
 * @property {string} [startDate]
 * @property {string} [endDate]
 */

/**
 * @typedef {Object} UserQueryParams
 * @property {number} pageNum
 * @property {number} pageSize
 * @property {string} [username]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {'ACTIVE'|'INACTIVE'|'SUSPENDED'} [status]
 */

/**
 * @typedef {Object} OrderQueryParams
 * @property {number} pageNum
 * @property {number} pageSize
 * @property {string} [orderId]
 * @property {number} [userId]
 * @property {number} [merchantId]
 * @property {'PENDING'|'CONFIRMED'|'PREPARING'|'DELIVERING'|'COMPLETED'|'CANCELLED'} [status]
 * @property {string} [startDate]
 * @property {string} [endDate]
 */

// ============== 仪表盘数据 ==============

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalUsers
 * @property {number} totalMerchants
 * @property {number} totalOrders
 * @property {number} totalRevenue
 * @property {number} todayOrders
 * @property {number} todayRevenue
 * @property {number} activeServices
 * @property {number} pendingSettlements
 * @property {RevenueStats} revenueStats
 */

/**
 * @typedef {Object} RevenueStats
 * @property {Array} dailyRevenue
 * @property {Array} monthlyRevenue
 * @property {number} growth
 */

/**
 * @typedef {Object} ServiceSubscriptionStats
 * @property {string} serviceName
 * @property {number} subscriptionCount
 * @property {number} monthlyRevenue
 * @property {number} growth
 */

// ============== 错误处理 ==============

/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {number} code
 * @property {any} details
 */

// ============== 常量定义 ==============

// 状态常量
export const SERVICE_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    DRAFT: 'DRAFT'
};

export const SETTLEMENT_STATUS = {
    PENDING_CONFIRM: 'PENDING_CONFIRM',
    CONFIRMED: 'CONFIRMED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED'
};

export const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    DELIVERING: 'DELIVERING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

export const COMMISSION_STATUS = {
    CALCULATED: 'CALCULATED',
    SETTLED: 'SETTLED',
    PAID: 'PAID'
};

export const SERVICE_CATEGORY = {
    PAYMENT: 'PAYMENT',
    DELIVERY: 'DELIVERY',
    MARKETING: 'MARKETING',
    DATA_ANALYTICS: 'DATA_ANALYTICS'
};

export const FEE_TYPE = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED',
    TIERED: 'TIERED'
};

export const BILLING_CYCLE = {
    MONTHLY: 'MONTHLY',
    WEEKLY: 'WEEKLY',
    DAILY: 'DAILY'
};

export const USER_ROLE = {
    ADMIN: 'admin',
    MERCHANT: 'merchant',
    CUSTOMER: 'customer'
};

// 默认导出
export default {
    SERVICE_STATUS,
    SETTLEMENT_STATUS,
    ORDER_STATUS,
    COMMISSION_STATUS,
    SERVICE_CATEGORY,
    FEE_TYPE,
    BILLING_CYCLE,
    USER_ROLE
};