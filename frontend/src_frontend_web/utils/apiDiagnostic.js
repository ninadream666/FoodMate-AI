/**
 * API 连接测试工具 - 专门用于诊断统计数据为0的问题
 */

import { platformApi, orderApi, merchantApi, userApi } from '../services/admin/apiConfig';

class ApiDiagnostic {
    constructor() {
        this.results = [];
    }

    // 测试所有统计相关的API端点
    async runDiagnosticTests() {
        console.log('🔬 开始API连接诊断测试...');
        this.results = [];

        const tests = [
            // 平台服务测试
            {
                name: '平台服务 - 仪表盘概览',
                test: () => platformApi.get('/api/admin/dashboard/overview'),
                service: 'Platform Service (8088)',
                endpoint: '/api/admin/dashboard/overview'
            },
            {
                name: '平台服务 - 系统通知',
                test: () => platformApi.get('/api/admin/notifications'),
                service: 'Platform Service (8088)',
                endpoint: '/api/admin/notifications'
            },

            // 订单服务测试
            {
                name: '订单服务 - 订单统计',
                test: () => orderApi.get('/api/admin/orders/stats'),
                service: 'Order Service (8084)',
                endpoint: '/api/admin/orders/stats'
            },
            {
                name: '订单服务 - 订单列表',
                test: () => orderApi.get('/api/admin/orders/all?page=0&size=1'),
                service: 'Order Service (8084)',
                endpoint: '/api/admin/orders/all'
            },
            {
                name: '订单服务 - 今日订单数',
                test: () => orderApi.get('/api/admin/orders/today-count'),
                service: 'Order Service (8084)',
                endpoint: '/api/admin/orders/today-count'
            },
            {
                name: '订单服务 - 总销售额',
                test: () => orderApi.get('/api/admin/orders/total-sales'),
                service: 'Order Service (8084)',
                endpoint: '/api/admin/orders/total-sales'
            },

            // 商家服务测试
            {
                name: '商家服务 - 商家统计',
                test: () => merchantApi.get('/api/admin/merchants/stats'),
                service: 'Merchant Service (8081)',
                endpoint: '/api/admin/merchants/stats'
            },
            {
                name: '商家服务 - 商家列表',
                test: () => merchantApi.get('/api/admin/merchants?page=0&size=1'),
                service: 'Merchant Service (8081)',
                endpoint: '/api/admin/merchants'
            },

            // 用户服务测试
            {
                name: '用户服务 - 用户统计',
                test: () => userApi.get('/admin/users/stats'),
                service: 'User Service (8083)',
                endpoint: '/admin/users/stats'
            },
            {
                name: '用户服务 - 用户列表',
                test: () => userApi.get('/admin/users?page=0&size=1'),
                service: 'User Service (8083)',
                endpoint: '/admin/users'
            }
        ];

        const testPromises = tests.map(async (testCase) => {
            return await this.runSingleTest(testCase);
        });

        const results = await Promise.allSettled(testPromises);

        // 生成诊断报告
        const report = this.generateDiagnosticReport(results);
        console.log('📊 API连接诊断报告:', report);

        return report;
    }

    async runSingleTest(testCase) {
        const startTime = Date.now();

        try {
            console.log(`🔍 测试: ${testCase.name}`);
            const response = await testCase.test();
            const duration = Date.now() - startTime;

            const result = {
                name: testCase.name,
                service: testCase.service,
                endpoint: testCase.endpoint,
                status: 'success',
                statusCode: response.status,
                duration,
                dataType: typeof response.data,
                hasData: !!response.data,
                dataStructure: this.analyzeDataStructure(response.data),
                timestamp: new Date().toISOString()
            };

            console.log(`✅ ${testCase.name} - 成功 (${duration}ms)`, {
                status: response.status,
                dataType: typeof response.data,
                hasData: !!response.data
            });

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            const result = {
                name: testCase.name,
                service: testCase.service,
                endpoint: testCase.endpoint,
                status: 'failed',
                duration,
                error: {
                    message: error.message,
                    code: error.code,
                    httpStatus: error.originalError?.response?.status,
                    httpStatusText: error.originalError?.response?.statusText
                },
                timestamp: new Date().toISOString()
            };

            console.error(`❌ ${testCase.name} - 失败 (${duration}ms)`, {
                message: error.message,
                httpStatus: error.originalError?.response?.status
            });

            return result;
        }
    }

    analyzeDataStructure(data) {
        if (!data) return 'null/undefined';

        if (typeof data === 'object') {
            if (Array.isArray(data)) {
                return `array[${data.length}]`;
            } else {
                const keys = Object.keys(data);
                return `object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`;
            }
        }

        return typeof data;
    }

    generateDiagnosticReport(results) {
        const total = results.length;
        const successful = results.filter(r => r.value?.status === 'success').length;
        const failed = total - successful;
        const avgDuration = results.reduce((sum, r) => sum + (r.value?.duration || 0), 0) / total;

        // 按服务分组统计
        const byService = {};
        results.forEach(r => {
            if (r.value) {
                const service = r.value.service;
                if (!byService[service]) {
                    byService[service] = { total: 0, success: 0, failed: 0 };
                }
                byService[service].total++;
                if (r.value.status === 'success') {
                    byService[service].success++;
                } else {
                    byService[service].failed++;
                }
            }
        });

        // 提取失败的测试
        const failedTests = results
            .filter(r => r.value?.status === 'failed')
            .map(r => ({
                name: r.value.name,
                service: r.value.service,
                endpoint: r.value.endpoint,
                error: r.value.error
            }));

        return {
            summary: {
                total,
                successful,
                failed,
                successRate: ((successful / total) * 100).toFixed(2) + '%',
                averageDuration: Math.round(avgDuration) + 'ms',
                timestamp: new Date().toISOString()
            },
            byService,
            failedTests,
            recommendations: this.generateRecommendations(byService, failedTests)
        };
    }

    generateRecommendations(byService, failedTests) {
        const recommendations = [];

        // 检查各服务状态
        Object.entries(byService).forEach(([service, stats]) => {
            if (stats.failed === stats.total) {
                recommendations.push(`🔴 ${service} 完全不可用 - 检查服务是否启动`);
            } else if (stats.failed > 0) {
                recommendations.push(`🟡 ${service} 部分API失败 - 检查特定端点配置`);
            } else {
                recommendations.push(`🟢 ${service} 运行正常`);
            }
        });

        // 特定问题诊断
        if (failedTests.some(t => t.error.httpStatus === 404)) {
            recommendations.push('💡 有404错误 - 检查API端点路径是否正确');
        }
        if (failedTests.some(t => t.error.httpStatus === 401)) {
            recommendations.push('💡 有401错误 - 检查认证token是否有效');
        }
        if (failedTests.some(t => t.error.httpStatus === 500)) {
            recommendations.push('💡 有500错误 - 检查后端服务是否正常运行');
        }
        if (failedTests.some(t => !t.error.httpStatus)) {
            recommendations.push('💡 有连接错误 - 检查网络连接和服务端口');
        }

        return recommendations;
    }
}

// 创建全局实例
const apiDiagnostic = new ApiDiagnostic();

// 导出方法
export const runApiDiagnostic = () => apiDiagnostic.runDiagnosticTests();
export default apiDiagnostic;