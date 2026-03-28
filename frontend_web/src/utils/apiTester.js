// 测试所有后端API连接的脚本
import {
    userApi,
    merchantApi,
    orderApi,
    marketingApi,
    platformApi
} from '../services/admin/apiConfig';

class ApiTester {
    constructor() {
        this.testResults = [];
    }

    async testApi(apiName, apiInstance, endpoint, testName) {
        try {
            console.log(`🧪 测试 ${testName}...`);
            const response = await apiInstance.get(endpoint);

            this.testResults.push({
                service: apiName,
                endpoint: endpoint,
                status: '✅ 成功',
                response: response.data,
                timestamp: new Date().toLocaleString()
            });

            console.log(`✅ ${testName} - 成功`, response.data);
            return { success: true, data: response.data };

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || '未知错误';

            this.testResults.push({
                service: apiName,
                endpoint: endpoint,
                status: '❌ 失败',
                error: errorMsg,
                timestamp: new Date().toLocaleString()
            });

            console.error(`❌ ${testName} - 失败:`, errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    // 测试优惠券toggle API的不同路径
    async testCouponToggle(templateId = 1) {
        console.log('🧪 测试优惠券模板禁用/启用API...');

        const testPaths = [
            { method: 'PUT', path: `/coupons/templates/${templateId}/toggle` },
            { method: 'POST', path: `/coupons/templates/${templateId}/toggle` },
            { method: 'PATCH', path: `/coupons/templates/${templateId}/toggle` },
            { method: 'PUT', path: `/coupons/templates/${templateId}/status` },
            { method: 'POST', path: `/coupons/templates/${templateId}/status` },
            { method: 'PUT', path: `/api/coupons/templates/${templateId}/toggle` },
            { method: 'POST', path: `/api/coupons/templates/${templateId}/toggle` },
            { method: 'PATCH', path: `/api/admin/coupons/templates/${templateId}/toggle-status` }
        ];

        const results = [];

        for (let test of testPaths) {
            try {
                console.log(`🔍 尝试 ${test.method} ${test.path}`);

                let response;
                switch (test.method) {
                    case 'PUT':
                        response = await marketingApi.put(test.path);
                        break;
                    case 'POST':
                        response = await marketingApi.post(test.path);
                        break;
                    case 'PATCH':
                        response = await marketingApi.patch(test.path);
                        break;
                }

                results.push({
                    method: test.method,
                    path: test.path,
                    status: '✅ 成功',
                    response: response.data
                });
                console.log(`✅ ${test.method} ${test.path} 成功!`);
                break; // 找到可用的就停止

            } catch (error) {
                const status = error.response?.status || 'NETWORK_ERROR';
                const message = error.response?.data?.message || error.message;

                results.push({
                    method: test.method,
                    path: test.path,
                    status: `❌ ${status}`,
                    error: message
                });
                console.log(`❌ ${test.method} ${test.path} - ${status}: ${message}`);
            }
        }

        return results;
    }

    async runAllTests() {
        console.log('🚀 开始API连接测试...\n');

        // 测试所有服务的健康检查
        const tests = [
            {
                name: '用户服务健康检查',
                api: userApi,
                service: 'USER_SERVICE',
                endpoint: '/api/admin/users/health'
            },
            {
                name: '商家服务健康检查',
                api: merchantApi,
                service: 'MERCHANT_SERVICE',
                endpoint: '/api/admin/merchants/health'
            },
            {
                name: '订单服务健康检查',
                api: orderApi,
                service: 'ORDER_SERVICE',
                endpoint: '/api/admin/orders/health'
            },
            {
                name: '营销服务健康检查',
                api: marketingApi,
                service: 'MARKETING_SERVICE',
                endpoint: '/api/admin/marketing/health'
            },
            {
                name: '平台服务健康检查',
                api: platformApi,
                service: 'PLATFORM_SERVICE',
                endpoint: '/api/admin/platform/health'
            }
        ];

        // 运行所有测试
        for (const test of tests) {
            await this.testApi(test.service, test.api, test.endpoint, test.name);
            // 稍微延迟避免过快请求
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 输出测试报告
        this.generateReport();
    }

    generateReport() {
        console.log('\n📋 API测试报告');
        console.log('='.repeat(50));

        const successCount = this.testResults.filter(r => r.status.includes('成功')).length;
        const failureCount = this.testResults.filter(r => r.status.includes('失败')).length;

        console.log(`总测试数: ${this.testResults.length}`);
        console.log(`成功: ${successCount}`);
        console.log(`失败: ${failureCount}`);
        console.log(`成功率: ${((successCount / this.testResults.length) * 100).toFixed(1)}%`);

        console.log('\n详细结果:');
        this.testResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.service} - ${result.status}`);
            if (result.error) {
                console.log(`   错误: ${result.error}`);
            }
        });

        // 提供修复建议
        if (failureCount > 0) {
            console.log('\n🛠️ 修复建议:');
            console.log('1. 检查后端服务是否启动');
            console.log('2. 确认API端口配置是否正确');
            console.log('3. 检查网络连接');
            console.log('4. 验证API路径是否正确');
        }
    }

    // 测试特定功能的API
    async testDashboardAPIs() {
        console.log('\n🎯 测试仪表盘相关API...\n');

        const dashboardTests = [
            {
                name: '获取KPI指标',
                api: platformApi,
                service: 'PLATFORM_SERVICE',
                endpoint: '/api/admin/dashboard/overview'
            },
            {
                name: '获取最新商家',
                api: merchantApi,
                service: 'MERCHANT_SERVICE',
                endpoint: '/api/admin/merchants/latest?limit=5'
            },
            {
                name: '获取订单统计',
                api: orderApi,
                service: 'ORDER_SERVICE',
                endpoint: '/api/admin/orders/stats'
            },
            {
                name: '获取用户统计',
                api: userApi,
                service: 'USER_SERVICE',
                endpoint: '/api/admin/users/stats'
            }
        ];

        for (const test of dashboardTests) {
            await this.testApi(test.service, test.api, test.endpoint, test.name);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// 导出测试器
export default ApiTester;

// 如果直接运行这个文件
if (typeof window !== 'undefined') {
    window.runApiTests = async () => {
        const tester = new ApiTester();
        await tester.runAllTests();
        await tester.testDashboardAPIs();
        return tester.testResults;
    };
}