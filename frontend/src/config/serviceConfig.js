// src/config/serviceConfig.js
import { Platform } from 'react-native';

// 开发环境配置
const DEVELOPMENT_CONFIG = {
    // 使用adb reverse映射
    API_HOST: Platform.select({
        android: 'http://127.0.0.1:3000', 
        ios: 'http://127.0.0.1:3000',
        default: 'http://127.0.0.1:3000'
    }),
    
    // 请求超时时间 (毫秒)
    TIMEOUT: 60000,

    // 重试次数r
    MAX_RETRIES: 3
};

// 生产环境配置
const PRODUCTION_CONFIG = {
    API_HOST: 'http://8.217.223.120', // 阿里云真实公网IP，不加端口，默认走80
    TIMEOUT: 10000,
    MAX_RETRIES: 2
};

// 当前配置
const CONFIG = __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

// 全部走统一网关前缀
export const SERVICE_URLS = {
    auth: `${CONFIG.API_HOST}/app-api/auth`,           // user-service
    users: `${CONFIG.API_HOST}/app-api/users`,         // user-service
    merchants: `${CONFIG.API_HOST}/app-api/merchants`, // merchant-service
    orders: `${CONFIG.API_HOST}/app-api/orders`,       // order-service
    coupons: `${CONFIG.API_HOST}/app-api/coupons`,     // marketing-service
    marketing: `${CONFIG.API_HOST}/app-api/marketing`, // marketing-service
    profile: `${CONFIG.API_HOST}/app-api/profile`,     // profile-service
    recommendation: `${CONFIG.API_HOST}/app-api/recommendation`, // recommendation-service
    platform: `${CONFIG.API_HOST}/app-api/platform`,   // platform-service
    merchantPlatform: `${CONFIG.API_HOST}/app-api/merchantPlatform`,
    merchantSettlement: `${CONFIG.API_HOST}/app-api/merchantSettlement`,
    merchantCommission: `${CONFIG.API_HOST}/app-api/merchantCommission`,
    'ai-pricing': `${CONFIG.API_HOST}/app-api/ai-pricing`, // ai-pricing-service
    nutrivision: `${CONFIG.API_HOST}/app-api/nutrivision`, // nutrivision-service
};

export const API_CONFIG = {
    TIMEOUT: CONFIG.TIMEOUT,
    MAX_RETRIES: CONFIG.MAX_RETRIES,
    API_HOST: CONFIG.API_HOST
};

export default SERVICE_URLS;