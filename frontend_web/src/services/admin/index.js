// Admin services 统一导出
// 基于API测试文件分析的完整服务架构

// ============== 核心配置 ==============
export { default as apiConfig, API_ENDPOINTS, API_STATUS, ERROR_MESSAGES } from './apiConfig';

// ============== 认证服务 ==============
export { default as authService } from './authService';

// ============== 订单相关服务 ==============
export { default as orderService } from './orderService';
export { default as orderStatsService } from './orderStatsService';

// ============== 商家管理服务 ==============
export { default as merchantService } from './merchantService';

// ============== 用户管理服务 ==============
export { default as userService } from './userService';

// ============== 营销服务 ==============
export { default as marketingService } from './marketingService';

// ============== 平台服务 ==============
export { default as platformService } from './platformService';

// ============== 结算服务 ==============
export { default as settlementService } from './settlementService';

// ============== 仪表盘服务 ==============
export { default as dashboardService } from './dashboardService';

// ============== 系统监控服务 ==============
export { default as systemService } from './systemService';

// ============== API测试和调试工具 ==============
export { default as apiTester, runApiTests, testOrderService, testPlatformService, validateEndpoints, diagnoseNetwork } from './apiTester';

// ============== 服务映射表 ==============
/**
 * 根据API测试文件分析的服务端口映射：
 * 
 *  商家服务 (merchantService): 8081
 *   - 商家注册、认证、信息管理
 *   - 商品管理、店铺设置
 * 
 *  营销服务 (marketingService): 8082  
 *   - 优惠券模板创建与管理
 *   - 优惠券发放与计算
 * 
 *  用户服务 (userService): 8083
 *   - 用户注册、登录、个人信息
 *   - 用户认证与权限管理
 * 
 *  订单服务 (orderService): 8084
 *   - 订单创建、查询、状态管理
 *   - 订单统计、趋势分析
 *   - 支付确认、退款处理
 * 
 *  用户资料服务 (profileService): 8086
 *   - 用户详细资料管理
 *   - 地址簿、偏好设置
 * 
 *  推荐服务 (recommendationService): 8087
 *   - 个性化推荐算法
 *   - 商品推荐、商家推荐
 * 
 *  平台服务 (platformService): 8088
 *   - 分成管理、结算处理
 *   - 平台配置、系统设置
 *   - 内部接口服务
 */

// ============== 便捷方法 ==============

/**
 * 获取所有服务实例
 * @returns {Object} 包含所有服务的对象
 */
export const getAllServices = () => ({
    auth: authService,
    order: orderService,
    orderStats: orderStatsService,
    merchant: merchantService,
    user: userService,
    marketing: marketingService,
    platform: platformService,
    settlement: settlementService,
    dashboard: dashboardService,
    system: systemService
});

/**
 * 获取API端点常量
 * @returns {Object} API_ENDPOINTS对象
 */
export const getApiEndpoints = () => API_ENDPOINTS;

/**
 * 获取服务健康状态检查方法
 * @returns {Function} 健康检查函数
 */
export const checkServicesHealth = async () => {
    const services = getAllServices();
    const healthStatus = {};

    for (const [serviceName, service] of Object.entries(services)) {
        try {
            // 如果服务有健康检查方法就调用，否则标记为未知
            if (typeof service.healthCheck === 'function') {
                healthStatus[serviceName] = await service.healthCheck();
            } else {
                healthStatus[serviceName] = { status: 'unknown', message: '未实现健康检查' };
            }
        } catch (error) {
            healthStatus[serviceName] = {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    console.log('🏥 服务健康状态检查结果:', healthStatus);
    return healthStatus;
};

export default {
    // 服务实例
    authService,
    orderService,
    orderStatsService,
    merchantService,
    userService,
    marketingService,
    platformService,
    settlementService,
    dashboardService,
    systemService,

    // 配置和常量
    apiConfig,
    API_ENDPOINTS,
    API_STATUS,
    ERROR_MESSAGES,

    // 便捷方法
    getAllServices,
    getApiEndpoints,
    checkServicesHealth
};