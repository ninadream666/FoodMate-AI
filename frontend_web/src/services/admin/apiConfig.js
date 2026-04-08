import axios from 'axios';

// API基础地址配置 
const isDev = import.meta.env.DEV;

const API_BASE_URLS = {
    // 各服务的API路径前缀
    USER_SERVICE: '/api', 
    MERCHANT_SERVICE: '',
    ORDER_SERVICE: '',
    MARKETING_SERVICE: '',
    PLATFORM_SERVICE: '',
    PROFILE_SERVICE: '',
    RECOMMENDATION_SERVICE: ''
};

// 统一的API响应状态码
export const API_STATUS = {
    SUCCESS: 200,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
};

// 通用的错误消息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接失败，请检查网络',
    UNAUTHORIZED: '登录已过期，请重新登录',
    FORBIDDEN: '权限不足，无法访问',
    NOT_FOUND: '请求的资源不存在',
    INTERNAL_ERROR: '服务器内部错误，请稍后重试',
    REQUEST_TIMEOUT: '请求超时，请稍后重试'
};

// 创建不同服务的axios实例
const createApiInstance = (baseURL, serviceName = '') => {
    const instance = axios.create({
        baseURL,
        timeout: 15000, // 增加超时时间到15秒
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // 请求拦截器 - 添加token和请求日志
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('adminToken');
            console.log(`[API ${serviceName}] 🔑 Token存在:`, !!token, token ? `${token.substring(0, 20)}...` : 'null');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // 开发环境下打印请求信息
            if (process.env.NODE_ENV === 'development') {
                console.log(`[API ${serviceName}] Request:`, {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    headers: config.headers,
                    data: config.data
                });
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // 响应拦截器 - 处理错误和统一数据格式
    instance.interceptors.response.use(
        (response) => {
            // 开发环境下打印响应信息
            if (process.env.NODE_ENV === 'development') {
                console.log(`[API ${serviceName}] Response:`, {
                    status: response.status,
                    data: response.data
                });
            }

            // 直接返回response，让具体的service处理数据结构
            return response;
        },
        (error) => {
            let errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
            let errorCode = 0;

            if (error.response) {
                // 服务器返回了错误状态码
                const { status, data } = error.response;
                errorCode = status;

                switch (status) {
                    case API_STATUS.UNAUTHORIZED:
                        errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
                        // 清除token并跳转登录
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUser');
                        if (window.location.pathname !== '/login') {
                            window.location.href = '/login';
                        }
                        break;
                    case API_STATUS.FORBIDDEN:
                        errorMessage = ERROR_MESSAGES.FORBIDDEN;
                        break;
                    case API_STATUS.NOT_FOUND:
                        errorMessage = ERROR_MESSAGES.NOT_FOUND;
                        break;
                    case API_STATUS.INTERNAL_ERROR:
                        errorMessage = ERROR_MESSAGES.INTERNAL_ERROR;
                        break;
                    default:
                        errorMessage = data?.message || data?.error || ERROR_MESSAGES.NETWORK_ERROR;
                }
            } else if (error.request) {
                // 请求已发出但没有收到响应
                errorMessage = ERROR_MESSAGES.REQUEST_TIMEOUT;
            } else {
                // 其他错误
                errorMessage = error.message || ERROR_MESSAGES.NETWORK_ERROR;
            }

            // 开发环境下打印错误信息
            if (process.env.NODE_ENV === 'development') {
                console.error(`[API ${serviceName}] Error:`, {
                    code: errorCode,
                    message: errorMessage,
                    originalError: error
                });
            }

            return Promise.reject({
                code: errorCode,
                message: errorMessage,
                originalError: error
            });
        }
    );

    return instance;
};

// 各服务的API实例
export const userApi = createApiInstance(API_BASE_URLS.USER_SERVICE, 'USER');
export const merchantApi = createApiInstance(API_BASE_URLS.MERCHANT_SERVICE, 'MERCHANT');
export const orderApi = createApiInstance(API_BASE_URLS.ORDER_SERVICE, 'ORDER');
export const marketingApi = createApiInstance(API_BASE_URLS.MARKETING_SERVICE, 'MARKETING');
export const platformApi = createApiInstance(API_BASE_URLS.PLATFORM_SERVICE, 'PLATFORM');
export const profileApi = createApiInstance(API_BASE_URLS.PROFILE_SERVICE, 'PROFILE');
export const recommendationApi = createApiInstance(API_BASE_URLS.RECOMMENDATION_SERVICE, 'RECOMMENDATION');

// API端点常量 - 基于API测试文件的接口分析
export const API_ENDPOINTS = {
    // 平台服务端点 (端口: 8088)
    DASHBOARD: {
        // Dashboard页面统计数据
        OVERVIEW: '/api/admin/dashboard/overview',        // 获取平台总览统计
        REVENUE: '/api/admin/dashboard/revenue',          // 获取收入统计
        GROWTH: '/api/admin/dashboard/growth'             // 获取增长趋势
    },

    // 订单服务端点
    ORDERS: {
        // 管理员订单管理
        ADMIN_ALL: '/api/admin/orders/all',              // 获取所有订单(分页)
        ADMIN_DETAIL: '/api/admin/orders',               // 获取订单详情 /{orderId}
        ADMIN_STATUS: '/api/admin/orders',               // 修改订单状态 /{orderId}/status
        ADMIN_STATS: '/api/admin/orders/stats',          // 获取订单统计
        ADMIN_SALES: '/api/admin/orders/total-sales',    // 获取总销售额
        ADMIN_TODAY: '/api/admin/orders/today-count',    // 获取今日订单数
        ADMIN_TRENDS: '/api/admin/orders/trends',        // 获取订单趋势(7天)

        // 内部接口
        INTERNAL_DETAIL: '/orders/internal',             // 内部接口获取订单详情 /{orderId}
        INTERNAL_CANCEL_APPROVE: '/orders/internal',     // 批准取消订单 /{orderId}/cancel-status/approve
        INTERNAL_CANCEL_REJECT: '/orders/internal',      // 拒绝取消订单 /{orderId}/cancel-status/reject
        INTERNAL_MERCHANT_REFUNDS: '/orders/internal/merchant', // 商家待审批订单 /{merchantId}/pending-refunds
        INTERNAL_PAYMENT_CONFIRM: '/orders/internal',    // 支付确认 /{orderId}/payment/confirm
        INTERNAL_PAYMENT_MOCK: '/orders/internal'        // 模拟支付 /{orderId}/payment/mock
    },

    // 用户服务端点
    USERS: {
        // 用户管理
        ADMIN_ALL: '/admin/users',                       // 获取所有用户(分页)
        ADMIN_DETAIL: '/admin/users',                    // 获取用户详情 /{userId}
        ADMIN_STATUS: '/admin/users',                    // 修改用户状态 /{userId}/status
        ADMIN_STATS: '/admin/users/stats',               // 获取用户统计
        ADMIN_CREDIT: '/admin/users',                    // 用户信用管理 /{userId}/credit
        ADMIN_SEARCH: '/admin/users/search'              // 搜索用户
    },

    // 商家服务端点
    MERCHANTS: {
        // 商家管理
        ADMIN_ALL: '/api/admin/merchants',               // 获取所有商家(分页)
        ADMIN_DETAIL: '/api/admin/merchants',            // 获取商家详情 /{merchantId}
        ADMIN_STATUS: '/api/admin/merchants',            // 修改商家状态 /{merchantId}/status
        ADMIN_STATS: '/api/admin/merchants/stats',       // 获取商家统计
        ADMIN_APPROVE: '/api/admin/merchants',           // 审核商家 /{merchantId}/approve
        ADMIN_REJECT: '/api/admin/merchants'             // 拒绝商家 /{merchantId}/reject
    },

    // 平台服务端点
    COMMISSIONS: {
        // 分成数据查询
        ORDER_COMMISSION: '/api/internal/commissions/order',      // 获取订单分成详情 /{orderId}
        MERCHANT_COMMISSION: '/api/merchant/commissions/order',   // 商家查看分成 /{orderId}
        MERCHANT_SUMMARY: '/api/merchant/commissions/summary',    // 商家分成汇总
        MONTHLY_SUMMARY: '/api/merchant/commissions/summary/this-month' // 本月分成汇总
    }
};

// 导出API基础地址配置供其他模块使用
export { API_BASE_URLS };

// 默认导出所有API实例
export default {
    userApi,
    merchantApi,
    orderApi,
    marketingApi,
    platformApi,
    profileApi,
    recommendationApi,
    API_STATUS,
    ERROR_MESSAGES,
    API_ENDPOINTS,
    API_BASE_URLS
};