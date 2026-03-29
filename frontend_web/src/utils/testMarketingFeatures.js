// 营销功能测试脚本
import marketingService from '../services/admin/marketingService';
import { debugApiConnection } from './debugApiConnection';

class MarketingTestRunner {
    constructor() {
        this.results = [];
    }

    // 记录测试结果
    logResult(testName, success, data = null, error = null) {
        const result = {
            testName,
            success,
            data,
            error: error?.message || error,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);

        if (success) {
            console.log(`✅ ${testName}: 成功`, data ? ` | 数据: ${JSON.stringify(data)}` : '');
        } else {
            console.error(`❌ ${testName}: 失败`, error);
        }

        return result;
    }

    // 测试获取优惠券模板列表
    async testGetCouponTemplates() {
        try {
            const templates = await marketingService.getCouponTemplates();
            return this.logResult('获取优惠券模板列表', true, `获取到 ${Array.isArray(templates) ? templates.length : 0} 个模板`);
        } catch (error) {
            return this.logResult('获取优惠券模板列表', false, null, error);
        }
    }

    // 测试获取优惠券统计
    async testGetCouponStats() {
        try {
            const stats = await marketingService.getCouponStats();
            return this.logResult('获取优惠券统计', true, stats);
        } catch (error) {
            return this.logResult('获取优惠券统计', false, null, error);
        }
    }

    // 测试切换优惠券状态（模拟测试，不实际执行）
    async testToggleCouponTemplate(templateId = null) {
        if (!templateId) {
            console.warn('⚠️ 跳过切换优惠券状态测试：缺少模板ID');
            return this.logResult('切换优惠券状态', false, null, '缺少模板ID');
        }

        try {
            // 这里只是测试API调用，不实际执行
            console.log(`📝 模拟测试：切换优惠券模板 ${templateId} 状态`);
            // const result = await marketingService.toggleCouponTemplate(templateId);
            return this.logResult('切换优惠券状态', true, '模拟测试成功');
        } catch (error) {
            return this.logResult('切换优惠券状态', false, null, error);
        }
    }

    // 测试健康检查
    async testHealthCheck() {
        try {
            const health = await marketingService.healthCheck();
            return this.logResult('营销服务健康检查', true, health);
        } catch (error) {
            return this.logResult('营销服务健康检查', false, null, error);
        }
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始营销功能测试...');
        console.log('━'.repeat(50));

        // 首先运行API连接诊断
        console.log('📡 运行API连接诊断...');
        const diagnostic = await debugApiConnection();
        console.log('📊 API诊断结果:', diagnostic.summary);

        console.log('━'.repeat(50));
        console.log('🧪 开始具体功能测试...');

        // 运行各项测试
        const tests = [
            () => this.testHealthCheck(),
            () => this.testGetCouponTemplates(),
            () => this.testGetCouponStats(),
            () => this.testToggleCouponTemplate() // 不传ID，只做模拟测试
        ];

        for (const test of tests) {
            await test();
            // 测试之间添加短暂延迟
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 生成测试报告
        this.generateReport();
    }

    // 生成测试报告
    generateReport() {
        console.log('━'.repeat(50));
        console.log('📋 营销功能测试报告');
        console.log('━'.repeat(50));

        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0;

        console.log(`📊 测试统计: ${successCount}/${totalCount} 通过 (${successRate}%)`);
        console.log('');

        // 详细结果
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${index + 1}. ${result.testName}`);

            if (!result.success && result.error) {
                console.log(`   错误: ${result.error}`);
            }

            if (result.data && result.success) {
                console.log(`   数据: ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)}`);
            }
        });

        console.log('━'.repeat(50));

        // 生成建议
        const failedTests = this.results.filter(r => !r.success);
        if (failedTests.length > 0) {
            console.log('💡 修复建议:');
            failedTests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.testName}:`);

                if (test.error?.includes('401') || test.error?.includes('认证')) {
                    console.log('   - 检查Token认证状态');
                    console.log('   - 确认管理员权限');
                } else if (test.error?.includes('404') || test.error?.includes('不存在')) {
                    console.log('   - 检查API端点是否正确');
                    console.log('   - 确认后端服务是否实现了相应接口');
                } else if (test.error?.includes('500') || test.error?.includes('服务器')) {
                    console.log('   - 检查后端服务运行状态');
                    console.log('   - 查看后端日志排查问题');
                } else {
                    console.log(`   - 检查网络连接`);
                    console.log(`   - 确认营销服务(8082端口)正常运行`);
                }
                console.log('');
            });
        } else {
            console.log('🎉 所有测试都通过了！营销功能运行正常。');
        }
    }
}

// 导出测试运行器
const marketingTester = new MarketingTestRunner();

// 导出便捷方法
export const runMarketingTests = () => marketingTester.runAllTests();
export const testCouponTemplates = () => marketingTester.testGetCouponTemplates();
export const testCouponStats = () => marketingTester.testGetCouponStats();

export default marketingTester;