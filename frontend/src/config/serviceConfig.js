// src/config/serviceConfig.js
import { Platform } from 'react-native';

// 开发环境配置
const DEVELOPMENT_CONFIG = {
    // 根据平台设置API主机
    // 使用 adb reverse 映射后，Android 模拟器可以直接通过 localhost 访问宿主机服务
    // 真机测试时改为电脑的局域网IP地址。
    API_HOST: Platform.select({
        android: 'http://127.0.0.1', 
        ios: 'http://127.0.0.1',
        default: 'http://127.0.0.1'
    })
    ,

    // 请求超时时间 (毫秒)
    TIMEOUT: 60000,

    // 重试次数r
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
    auth: `${CONFIG.API_HOST}:8083/auth`,      // user-service
    users: `${CONFIG.API_HOST}:8083/users`,        // user-service
    merchants: `${CONFIG.API_HOST}:8081/merchants`, // merchant-service
    orders: `${CONFIG.API_HOST}:8084/orders`,       // order-service
    coupons: `${CONFIG.API_HOST}:8082/api/coupons`,     // marketing-service
    marketing: `${CONFIG.API_HOST}:8082/marketing`, // marketing-service
    profile: `${CONFIG.API_HOST}:8086/profile`,     // profile-service
    recommendation: `${CONFIG.API_HOST}:8087/api/v2`, // recommendation-service
    platform: `${CONFIG.API_HOST}:8088/api/admin`,  // platform-service
    merchantPlatform: `${CONFIG.API_HOST}:8088/api/merchant/platform-services`,
    merchantSettlement: `${CONFIG.API_HOST}:8088/api/merchant/settlements`,
    merchantCommission: `${CONFIG.API_HOST}:8088/api/merchant/commissions`,
    'ai-pricing': `${CONFIG.API_HOST}:8089`,        // ai-pricing-service
    nutrivision: `${CONFIG.API_HOST}:8090`,         // nutrivision-service
};

export const API_CONFIG = {
    TIMEOUT: CONFIG.TIMEOUT,
    MAX_RETRIES: CONFIG.MAX_RETRIES,
    API_HOST: CONFIG.API_HOST
};

export default SERVICE_URLS;