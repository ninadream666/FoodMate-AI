// 平台管理端配置文件
const config = {
    // API 服务端点配置
    API_BASE_URLS: {
        USER_SERVICE: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8083',
        MERCHANT_SERVICE: process.env.REACT_APP_MERCHANT_SERVICE_URL || 'http://localhost:8081',
        ORDER_SERVICE: process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:8084',
        MARKETING_SERVICE: process.env.REACT_APP_MARKETING_SERVICE_URL || 'http://localhost:8082',
        PLATFORM_SERVICE: process.env.REACT_APP_PLATFORM_SERVICE_URL || 'http://localhost:8088',
        PROFILE_SERVICE: process.env.REACT_APP_PROFILE_SERVICE_URL || 'http://localhost:8086',
        RECOMMENDATION_SERVICE: process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://localhost:8087'
    },

    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },

    // 令牌配置
    AUTH: {
        TOKEN_KEY: 'adminToken',
        USER_KEY: 'adminUser',
        TOKEN_EXPIRE_TIME: 24 * 60 * 60 * 1000 // 24小时
    },

    // 业务配置
    BUSINESS: {
        DEFAULT_CURRENCY: '¥',
        DECIMAL_PLACES: 2,
        DATE_FORMAT: 'YYYY-MM-DD',
        DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
    },

    // 状态映射
    STATUS_LABELS: {
        // 服务状态
        SERVICE_STATUS: {
            ACTIVE: '活跃',
            INACTIVE: '非活跃',
            DRAFT: '草稿'
        },

        // 结算状态
        SETTLEMENT_STATUS: {
            PENDING_CONFIRM: '待确认',
            CONFIRMED: '已确认',
            PAID: '已打款',
            CANCELLED: '已取消'
        },

        // 订单状态
        ORDER_STATUS: {
            PENDING: '待处理',
            CONFIRMED: '已确认',
            PREPARING: '制作中',
            DELIVERING: '配送中',
            COMPLETED: '已完成',
            CANCELLED: '已取消'
        },

        // 商家状态
        MERCHANT_STATUS: {
            ACTIVE: '正常营业',
            INACTIVE: '停业',
            PENDING: '待审核',
            REJECTED: '审核不通过'
        },

        // 用户状态
        USER_STATUS: {
            ACTIVE: '正常',
            INACTIVE: '禁用',
            PENDING: '待验证'
        }
    },

    // 服务类别
    SERVICE_CATEGORIES: {
        PAYMENT: '支付服务',
        DELIVERY: '配送服务',
        MARKETING: '营销服务',
        DATA_ANALYTICS: '数据分析'
    },

    // 计费类型
    FEE_TYPES: {
        PERCENTAGE: '百分比',
        FIXED: '固定金额',
        TIERED: '阶梯计费'
    },

    // 计费周期
    BILLING_CYCLES: {
        MONTHLY: '月结',
        WEEKLY: '周结',
        DAILY: '日结'
    },

    // 优惠券类型
    COUPON_TYPES: {
        PERCENTAGE: '折扣',
        FIXED_AMOUNT: '减免金额'
    }
};

export default config;