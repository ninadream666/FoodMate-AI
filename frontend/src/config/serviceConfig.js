// src/config/serviceConfig.js
import { Platform } from 'react-native';

// 开发环境配置
const DEVELOPMENT_CONFIG = {
    // 根据平台设置API主机
    // 真机调试：使用您电脑的IP地址 192.168.1.16
    // 确保手机和电脑在同一WiFi网络中
    API_HOST: Platform.select({
        android: 'http://192.168.1.16',
        ios: 'http://192.168.1.16',
        default: 'http://192.168.1.16'
    }),

    // 请求超时时间 (毫秒)
    TIMEOUT: 15000,

    // 重试次数
    MAX_RETRIES: 3
};

// 生产环境配置
const PRODUCTION_CONFIG = {
    API_HOST: 'https://your-production-api.com',
    TIMEOUT: 10000,
    MAX_RETRIES: 2
};

// 当前配置
const CONFIG = __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

export const SERVICE_URLS = {
    auth: `${CONFIG.API_HOST}:8083/api/auth`,      // 对应 AuthController
    users: `${CONFIG.API_HOST}:8083/users`,        // 对应 UserController 和 AddressController
    merchants: `${CONFIG.API_HOST}:8081/merchants`, // 对应 MerchantController 等
    orders: `${CONFIG.API_HOST}:8084/orders`,       // 对应 OrderController
    coupons: `${CONFIG.API_HOST}:8082/coupons`,     // 对应 CouponController
    marketing: `${CONFIG.API_HOST}:8082/marketing`, // 对应 MarketingController
    profile: `${CONFIG.API_HOST}:8086/profile`,     // 对应 UserProfileController
    recommendation: `${CONFIG.API_HOST}:8087/api/v2`, // 推荐服务
    platform: `${CONFIG.API_HOST}:8088/api/admin`,  // 管理员平台服务 (需要 ADMIN 角色)
    merchantPlatform: `${CONFIG.API_HOST}:8088/api/merchant/platform-services`, // 商家端平台服务
    merchantSettlement: `${CONFIG.API_HOST}:8088/api/merchant/settlements`,     // 商家端结算服务
    merchantCommission: `${CONFIG.API_HOST}:8088/api/merchant/commissions`,     // 商家端分成服务
    'ai-pricing': `${CONFIG.API_HOST}:8090`,        // AI 智能定价服务
};

export const API_CONFIG = {
    TIMEOUT: CONFIG.TIMEOUT,
    MAX_RETRIES: CONFIG.MAX_RETRIES,
    API_HOST: CONFIG.API_HOST
};

export default SERVICE_URLS;