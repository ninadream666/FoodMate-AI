/**
 * 服务层入口文件
 * 统一导出所有用户端服务
 */

// API 客户端
export * from './apiClient';
export { default as apiClient } from './apiClient';

// 认证服务
export { authService } from './authService';

// 用户服务
export { userService } from './userService';

// 地址服务
export { addressService } from './addressService';

// 订单服务
export { orderService, ORDER_STATUS, getOrderStatusText, getOrderStatusColor } from './orderService';

// 商家服务
export { merchantService } from './merchantService';

// 钱包/优惠券服务
export { walletService } from './walletService';

// 用户画像服务
export { profileService } from './profileService';

// 推荐服务
export {
    recommendationService,
    getHomepageRecommendations,
    getSmartRecommendations,
    getV2Recommendations,
    checkHealth,
    getMcpStatus,
} from './recommendationService';
