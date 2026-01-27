/**
 * API 测试和调试工具
 * 基于 api-tests.http 文件的接口分析
 */

import { orderService, orderStatsService, API_ENDPOINTS } from './index';

class ApiTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    // ============== 订单服务接口测试 (8084) ==============

    async testOrderServiceEndpoints() {
        console.log('🧪 开始测试订单服务接口...');
        const tests = [];

        // 测试订单统计接口
        tests.push(this.runTest('订单统计数据', async () => {
            return await orderStatsService.getOrderStats();
        }));

        // 测试总销售额接口
        tests.push(this.runTest('总销售额数据', async () => {
            return await orderStatsService.getTotalSales();
        }));

        // 测试今日订单数接口
        tests.push(this.runTest('今日订单数', async () => {
            return await orderStatsService.getTodayOrderCount();
        }));

        // 测试订单趋势接口
        tests.push(this.runTest('订单趋势(7天)', async () => {
            return await orderStatsService.getOrderTrends();
        }));

        // 测试获取所有订单接口
        tests.push(this.runTest('获取所有订单(分页)', async () => {
            return await orderService.getAllOrders({ page: 0, size: 5 });
        }));

        // 测试按状态筛选订单
        tests.push(this.runTest('按状态筛选订单', async () => {
            return await orderService.getAllOrders({
                page: 0,
                size: 5,
                status: 'COMPLETED'
            });
        }));

        return await Promise.allSettled(tests);
    }

    // ============== 平台服务接口测试 (8088) ==============

    async testPlatformServiceEndpoints() {
        console.log('🧪 开始测试平台服务接口...');
        const tests = [];

        // 测试本月分成汇总
        tests.push(this.runTest('本月分成汇总', async () => {
            return await orderStatsService.getMonthlyCommissionSummary();
        }));

        // 测试指定时间范围分成汇总
        tests.push(this.runTest('指定时间范围分成汇总', async () => {
            return await orderStatsService.getCommissionSummary({
                startTime: '2025-01-01T00:00:00',
                endTime: '2025-12-31T23:59:59'
            });
        }));

        return await Promise.allSettled(tests);
    }

    // ============== 综合接口测试 ==============

    async runFullApiTest() {
        if (this.isRunning) {
            console.warn('⚠️ 测试正在运行中，请等待完成');
            return;
        }

        this.isRunning = true;
        this.testResults = [];

        console.log('🚀 开始完整API接口测试...');

        try {
            // 测试订单服务接口
            const orderTests = await this.testOrderServiceEndpoints();
            console.log('📊 订单服务测试完成:', orderTests);

            // 测试平台服务接口  
            const platformTests = await this.testPlatformServiceEndpoints();
            console.log('🏢 平台服务测试完成:', platformTests);

            // 测试仪表盘综合数据
            const dashboardTest = await this.runTest('仪表盘综合数据', async () => {
                return await orderStatsService.getDashboardStats();
            });
            console.log('📈 仪表盘测试完成:', dashboardTest);

            // 汇总测试结果
            const allResults = [
                ...orderTests,
                ...platformTests,
                dashboardTest
            ];

            const summary = this.generateTestSummary(allResults);
            console.log('📋 API测试总结:', summary);

            return summary;

        } catch (error) {
            console.error('❌ API测试过程中出现错误:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    // ============== 工具方法 ==============

    async runTest(testName, testFunction) {
        const startTime = Date.now();

        try {
            console.log(`🔄 正在测试: ${testName}`);
            const result = await testFunction();
            const duration = Date.now() - startTime;

            const testResult = {
                name: testName,
                status: 'success',
                duration,
                result,
                timestamp: new Date().toISOString()
            };

            console.log(`✅ ${testName} - 成功 (${duration}ms)`);
            this.testResults.push(testResult);
            return testResult;

        } catch (error) {
            const duration = Date.now() - startTime;

            const testResult = {
                name: testName,
                status: 'failed',
                duration,
                error: {
                    message: error.message,
                    code: error.code,
                    originalError: error.originalError
                },
                timestamp: new Date().toISOString()
            };

            console.error(`❌ ${testName} - 失败 (${duration}ms):`, error);
            this.testResults.push(testResult);
            return testResult;
        }
    }

    generateTestSummary(results) {
        const total = results.length;
        const successful = results.filter(r => r.value?.status === 'success').length;
        const failed = total - successful;
        const avgDuration = results.reduce((sum, r) => sum + (r.value?.duration || 0), 0) / total;

        return {
            total,
            successful,
            failed,
            successRate: ((successful / total) * 100).toFixed(2) + '%',
            averageDuration: Math.round(avgDuration) + 'ms',
            timestamp: new Date().toISOString(),
            details: results
        };
    }

    // ============== API端点验证 ==============

    validateApiEndpoints() {
        console.log('🔍 验证API端点配置...');

        const endpoints = API_ENDPOINTS;
        const validation = {
            orders: Object.keys(endpoints.ORDERS || {}),
            commissions: Object.keys(endpoints.COMMISSIONS || {}),
            total: 0
        };

        validation.total = validation.orders.length + validation.commissions.length;

        console.log('📋 API端点验证结果:', validation);
        return validation;
    }

    // ============== 网络诊断 ==============

    async diagnoseNetworkConnectivity() {
        console.log('🌐 开始网络连接诊断...');

        const services = [
            { name: '订单服务', port: 8084, endpoints: ['health', 'api/admin/orders/stats'] },
            { name: '平台服务', port: 8088, endpoints: ['health', 'api/internal/commissions'] },
            { name: '营销服务', port: 8082, endpoints: ['health', 'api/coupons/templates'] }
        ];

        const diagnostics = [];

        for (const service of services) {
            try {
                const baseUrl = `http://localhost:${service.port}`;
                console.log(`🔍 检查 ${service.name} (${baseUrl})`);

                // 这里可以添加实际的连接测试逻辑
                // 比如发送 OPTIONS 请求或者 GET /health 请求

                diagnostics.push({
                    service: service.name,
                    port: service.port,
                    status: 'unknown', // 需要实际测试才能确定
                    message: '需要实际网络请求来验证',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                diagnostics.push({
                    service: service.name,
                    port: service.port,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        console.log('🌐 网络诊断完成:', diagnostics);
        return diagnostics;
    }
}

// 创建全局实例
const apiTester = new ApiTester();

// 导出方法供外部使用
export const runApiTests = () => apiTester.runFullApiTest();
export const testOrderService = () => apiTester.testOrderServiceEndpoints();
export const testPlatformService = () => apiTester.testPlatformServiceEndpoints();
export const validateEndpoints = () => apiTester.validateApiEndpoints();
export const diagnoseNetwork = () => apiTester.diagnoseNetworkConnectivity();

export default apiTester;