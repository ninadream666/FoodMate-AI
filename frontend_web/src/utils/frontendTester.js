// 平台端前端快速测试脚本
// Platform Frontend Quick Test Script

class PlatformFrontendTester {
    constructor() {
        this.baseUrl = 'http://localhost:5173';
        this.adminToken = localStorage.getItem('adminToken');
        this.testResults = [];
    }

    // 记录测试结果
    log(test, status, message) {
        const result = {
            test,
            status,
            message,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
    }

    // 测试页面访问性
    async testPageAccess() {
        console.log('\n🔍 测试页面访问性...');

        const pages = [
            { name: '用户端首页', url: '/' },
            { name: '统一登录页', url: '/login' },
            { name: '管理员仪表盘', url: '/admin/dashboard' },
            { name: '平台服务管理', url: '/admin/services' },
            { name: '结算管理', url: '/admin/settlements' },
            { name: '商家管理', url: '/admin/merchants' },
            { name: '订单管理', url: '/admin/orders' },
            { name: '用户管理', url: '/admin/users' },
            { name: '营销管理', url: '/admin/marketing' }
        ];

        for (const page of pages) {
            try {
                const fullUrl = `${this.baseUrl}${page.url}`;
                const response = await fetch(fullUrl, { method: 'HEAD' });

                if (response.ok) {
                    this.log(`页面访问: ${page.name}`, 'PASS', `可正常访问 ${fullUrl}`);
                } else {
                    this.log(`页面访问: ${page.name}`, 'FAIL', `响应状态: ${response.status}`);
                }
            } catch (error) {
                this.log(`页面访问: ${page.name}`, 'FAIL', error.message);
            }
        }
    }

    // 测试后端服务连接
    async testBackendServices() {
        console.log('\n🌐 测试后端服务连接...');

        const services = [
            { name: '用户服务', port: 8083, healthPath: '/health' },
            { name: '商家服务', port: 8081, healthPath: '/health' },
            { name: '订单服务', port: 8084, healthPath: '/health' },
            { name: '营销服务', port: 8082, healthPath: '/health' },
            { name: '平台服务', port: 8088, healthPath: '/api/health' },
            { name: '用户档案服务', port: 8086, healthPath: '/health' },
            { name: '推荐服务', port: 8087, healthPath: '/health' }
        ];

        for (const service of services) {
            try {
                const url = `http://localhost:${service.port}${service.healthPath}`;
                const response = await fetch(url, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    this.log(`后端服务: ${service.name}`, 'PASS', `端口 ${service.port} 可访问`);
                } else {
                    this.log(`后端服务: ${service.name}`, 'FAIL', `响应状态: ${response.status}`);
                }
            } catch (error) {
                this.log(`后端服务: ${service.name}`, 'FAIL', `无法连接端口 ${service.port}`);
            }
        }
    }

    // 测试认证功能
    async testAuthentication() {
        console.log('\n🔐 测试认证功能...');

        // 测试登录API
        try {
            const loginUrl = 'http://localhost:8083/auth/login';
            const loginData = {
                username: 'admin',
                password: 'admin123'
            };

            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    this.adminToken = data.token;
                    this.log('认证测试', 'PASS', '登录成功，Token已保存');
                } else {
                    this.log('认证测试', 'FAIL', '登录成功但未返回Token');
                }
            } else {
                this.log('认证测试', 'FAIL', `登录失败: ${response.status}`);
            }
        } catch (error) {
            this.log('认证测试', 'FAIL', `登录异常: ${error.message}`);
        }

        // 测试Token验证
        if (this.adminToken) {
            try {
                const validateUrl = 'http://localhost:8083/auth/validate';
                const response = await fetch(validateUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.adminToken}`
                    }
                });

                if (response.ok) {
                    this.log('Token验证', 'PASS', 'Token有效');
                } else {
                    this.log('Token验证', 'FAIL', `Token验证失败: ${response.status}`);
                }
            } catch (error) {
                this.log('Token验证', 'FAIL', `Token验证异常: ${error.message}`);
            }
        }
    }

    // 测试核心API功能
    async testCoreAPIs() {
        console.log('\n🚀 测试核心API功能...');

        if (!this.adminToken) {
            this.log('API测试', 'SKIP', '无有效Token，跳过API测试');
            return;
        }

        const apis = [
            {
                name: '获取平台服务列表',
                url: 'http://localhost:8088/api/admin/platform-services',
                method: 'GET'
            },
            {
                name: '获取结算单列表',
                url: 'http://localhost:8088/api/admin/settlements',
                method: 'GET'
            },
            {
                name: '获取商家列表',
                url: 'http://localhost:8081/merchants',
                method: 'GET'
            },
            {
                name: '获取订单列表',
                url: 'http://localhost:8084/orders/admin/all',
                method: 'GET'
            },
            {
                name: '获取优惠券模板',
                url: 'http://localhost:8082/coupons/templates',
                method: 'GET'
            }
        ];

        for (const api of apis) {
            try {
                const response = await fetch(api.url, {
                    method: api.method,
                    headers: {
                        'Authorization': `Bearer ${this.adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.log(`API测试: ${api.name}`, 'PASS', `成功获取数据${data.data ? ` (${Array.isArray(data.data) ? data.data.length : '1'} 条)` : ''}`);
                } else {
                    this.log(`API测试: ${api.name}`, 'FAIL', `响应状态: ${response.status}`);
                }
            } catch (error) {
                this.log(`API测试: ${api.name}`, 'FAIL', error.message);
            }
        }
    }

    // 测试本地存储功能
    testLocalStorage() {
        console.log('\n💾 测试本地存储功能...');

        try {
            // 测试写入
            localStorage.setItem('test_key', 'test_value');
            const value = localStorage.getItem('test_key');

            if (value === 'test_value') {
                this.log('本地存储', 'PASS', '读写功能正常');
            } else {
                this.log('本地存储', 'FAIL', '读取值不匹配');
            }

            // 清理测试数据
            localStorage.removeItem('test_key');

            // 检查管理员信息
            const adminUser = localStorage.getItem('adminUser');
            const adminToken = localStorage.getItem('adminToken');

            if (adminUser && adminToken) {
                this.log('用户状态', 'PASS', '管理员登录信息已保存');
            } else {
                this.log('用户状态', 'INFO', '未找到管理员登录信息');
            }
        } catch (error) {
            this.log('本地存储', 'FAIL', error.message);
        }
    }

    // 测试响应式设计
    testResponsiveDesign() {
        console.log('\n📱 测试响应式设计...');

        const breakpoints = [
            { name: '手机端', width: 375 },
            { name: '平板端', width: 768 },
            { name: '桌面端', width: 1024 },
            { name: '大屏幕', width: 1440 }
        ];

        for (const bp of breakpoints) {
            try {
                // 模拟改变窗口大小（实际需要手动测试）
                this.log(`响应式: ${bp.name}`, 'INFO', `建议手动测试宽度 ${bp.width}px`);
            } catch (error) {
                this.log(`响应式: ${bp.name}`, 'FAIL', error.message);
            }
        }
    }

    // 生成测试报告
    generateReport() {
        console.log('\n📊 测试报告生成中...');

        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        const info = this.testResults.filter(r => r.status === 'INFO').length;

        console.log('\n==========================');
        console.log('🎯 测试结果汇总');
        console.log('==========================');
        console.log(`总测试数: ${total}`);
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        console.log(`⏭️  跳过: ${skipped}`);
        console.log(`ℹ️  信息: ${info}`);
        console.log(`成功率: ${total > 0 ? ((passed / (total - skipped - info)) * 100).toFixed(1) : 0}%`);

        // 详细失败信息
        const failedTests = this.testResults.filter(r => r.status === 'FAIL');
        if (failedTests.length > 0) {
            console.log('\n❌ 失败的测试详情:');
            failedTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.message}`);
            });
        }

        // 生成建议
        console.log('\n💡 建议:');
        if (failed > 0) {
            console.log('   • 请检查失败的测试项，确保后端服务正常运行');
            console.log('   • 确认网络连接和端口配置正确');
        }
        if (passed > failed) {
            console.log('   • 大部分功能正常，可以开始使用系统');
        }
        console.log('   • 建议手动测试各个页面的UI交互功能');
        console.log('   • 在不同设备和浏览器上进行兼容性测试');

        return {
            total,
            passed,
            failed,
            skipped,
            info,
            successRate: total > 0 ? ((passed / (total - skipped - info)) * 100).toFixed(1) : 0,
            details: this.testResults
        };
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始平台端前端全面测试...');
        console.log('=================================');

        this.testResults = []; // 重置结果

        // 依次运行各项测试
        await this.testPageAccess();
        await this.testBackendServices();
        await this.testAuthentication();
        await this.testCoreAPIs();
        this.testLocalStorage();
        this.testResponsiveDesign();

        // 生成最终报告
        const report = this.generateReport();

        console.log('\n🎉 测试完成！');
        console.log('您可以通过以下方式查看详细结果:');
        console.log('   • 控制台输出 (已显示)');
        console.log('   • 返回的测试报告对象');

        return report;
    }

    // 快速健康检查
    async quickHealthCheck() {
        console.log('⚡ 快速健康检查...');

        this.testResults = [];
        await this.testBackendServices();
        this.testLocalStorage();

        const report = this.generateReport();
        console.log(`\n⚡ 快速检查完成 - 成功率: ${report.successRate}%`);

        return report;
    }
}

// 导出测试类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformFrontendTester;
} else if (typeof window !== 'undefined') {
    window.PlatformFrontendTester = PlatformFrontendTester;
}

// 自动执行测试（如果直接运行）
if (typeof window !== 'undefined' && window.location) {
    console.log('🔧 平台端前端测试工具已加载');
    console.log('使用方法：');
    console.log('   const tester = new PlatformFrontendTester();');
    console.log('   await tester.runAllTests();           // 完整测试');
    console.log('   await tester.quickHealthCheck();      // 快速检查');
    console.log('');
    console.log('💡 提示：打开浏览器开发者工具查看详细输出');
}

export default PlatformFrontendTester;