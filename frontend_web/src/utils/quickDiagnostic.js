/**
 * 快速问题诊断脚本
 * 一键检查统计数据为0的常见原因
 */

class QuickDiagnostic {
    async runDiagnostic() {
        console.log('🔍 开始快速诊断...');

        const report = {
            timestamp: new Date().toISOString(),
            checks: {},
            issues: [],
            recommendations: []
        };

        // 检查1: Token存在性
        await this.checkTokens(report);

        // 检查2: API连通性
        await this.checkApiConnectivity(report);

        // 检查3: 服务响应
        await this.checkServiceResponses(report);

        // 检查4: 数据结构
        await this.checkDataStructure(report);

        // 生成总结
        this.generateSummary(report);

        console.log('📊 诊断完成:', report);
        return report;
    }

    async checkTokens(report) {
        console.log('🔐 检查认证Token...');

        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');

        report.checks.tokens = {
            adminTokenExists: !!adminToken,
            adminTokenLength: adminToken?.length || 0,
            adminUserExists: !!adminUser,
            adminUserValid: false
        };

        if (!adminToken) {
            report.issues.push('❌ 未找到admin token');
            report.recommendations.push('💡 请先登录管理后台获取token');
        } else {
            console.log('✅ Admin token存在，长度:', adminToken.length);
        }

        if (adminUser) {
            try {
                const user = JSON.parse(adminUser);
                report.checks.tokens.adminUserValid = true;
                report.checks.tokens.adminUserRole = user.role;
                console.log('✅ Admin用户信息有效:', user);
            } catch (e) {
                report.issues.push('❌ Admin用户信息格式错误');
                report.recommendations.push('💡 清除localStorage中的adminUser并重新登录');
            }
        }
    }

    async checkApiConnectivity(report) {
        console.log('🌐 检查API连通性...');

        const endpoints = [
            { name: 'Platform', url: '/api/admin/dashboard/overview', port: 8088 },
            { name: 'Order', url: '/api/admin/orders/stats', port: 8084 },
            { name: 'User', url: '/admin/users/stats', port: 8083 },
            { name: 'Merchant', url: '/api/admin/merchants', port: 8081 }
        ];

        report.checks.connectivity = {};

        for (const endpoint of endpoints) {
            try {
                // 简单的连通性测试，只发送HEAD请求
                const response = await fetch(endpoint.url, {
                    method: 'HEAD',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                report.checks.connectivity[endpoint.name] = {
                    status: response.status,
                    reachable: response.status !== 0,
                    url: endpoint.url,
                    port: endpoint.port
                };

                if (response.status === 0 || response.status >= 500) {
                    report.issues.push(`❌ ${endpoint.name} Service (端口${endpoint.port}) 无法访问`);
                    report.recommendations.push(`💡 检查${endpoint.name} Service是否在端口${endpoint.port}运行`);
                } else {
                    console.log(`✅ ${endpoint.name} Service 可访问 (状态码: ${response.status})`);
                }
            } catch (error) {
                report.checks.connectivity[endpoint.name] = {
                    reachable: false,
                    error: error.message,
                    url: endpoint.url,
                    port: endpoint.port
                };

                report.issues.push(`❌ ${endpoint.name} Service 连接失败: ${error.message}`);
                report.recommendations.push(`💡 检查网络连接和${endpoint.name} Service状态`);
            }
        }
    }

    async checkServiceResponses(report) {
        console.log('📊 检查服务响应数据...');

        report.checks.responses = {};

        // 检查Dashboard API
        try {
            const response = await fetch('/api/admin/dashboard/overview', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                report.checks.responses.dashboard = {
                    success: true,
                    data: data,
                    hasData: this.hasNonZeroValues(data)
                };

                if (!this.hasNonZeroValues(data)) {
                    report.issues.push('⚠️ Dashboard API返回数据全为0');
                    report.recommendations.push('💡 检查Platform Service的数据聚合逻辑或数据库数据');
                } else {
                    console.log('✅ Dashboard API返回有效数据');
                }
            } else {
                report.checks.responses.dashboard = {
                    success: false,
                    status: response.status,
                    statusText: response.statusText
                };

                report.issues.push(`❌ Dashboard API返回错误状态: ${response.status}`);

                if (response.status === 401) {
                    report.recommendations.push('💡 Token无效或已过期，请重新登录');
                } else if (response.status === 403) {
                    report.recommendations.push('💡 权限不足，检查admin账号权限');
                }
            }
        } catch (error) {
            report.checks.responses.dashboard = {
                success: false,
                error: error.message
            };
            report.issues.push(`❌ Dashboard API请求失败: ${error.message}`);
        }
    }

    async checkDataStructure(report) {
        console.log('🏗️ 检查数据结构...');

        if (report.checks.responses?.dashboard?.data) {
            const data = report.checks.responses.dashboard.data;
            const expectedFields = [
                'totalRevenue', 'totalSales', 'totalUserCount', 'userCount',
                'totalMerchantCount', 'activeMerchantCount', 'merchantCount',
                'todayOrderCount', 'orderCount'
            ];

            const presentFields = expectedFields.filter(field =>
                data[field] !== undefined && data[field] !== null
            );

            report.checks.dataStructure = {
                expectedFields: expectedFields.length,
                presentFields: presentFields.length,
                coverage: presentFields.length / expectedFields.length,
                missingFields: expectedFields.filter(field => data[field] === undefined)
            };

            if (presentFields.length < expectedFields.length * 0.5) {
                report.issues.push('⚠️ 数据结构不完整，缺少大量预期字段');
                report.recommendations.push('💡 检查后端API实现，确保返回所有必要字段');
            }

            console.log(`📋 数据字段覆盖率: ${presentFields.length}/${expectedFields.length}`);
        }
    }

    hasNonZeroValues(obj) {
        if (!obj || typeof obj !== 'object') return false;

        return Object.values(obj).some(value => {
            if (typeof value === 'number') {
                return value !== 0;
            }
            if (typeof value === 'string') {
                const num = parseFloat(value);
                return !isNaN(num) && num !== 0;
            }
            return false;
        });
    }

    generateSummary(report) {
        const totalChecks = Object.keys(report.checks).length;
        const issuesCount = report.issues.length;

        if (issuesCount === 0) {
            report.summary = {
                status: 'healthy',
                message: '✅ 未发现明显问题',
                severity: 'low'
            };
        } else if (issuesCount <= 2) {
            report.summary = {
                status: 'warning',
                message: `⚠️ 发现${issuesCount}个问题，需要关注`,
                severity: 'medium'
            };
        } else {
            report.summary = {
                status: 'error',
                message: `❌ 发现${issuesCount}个问题，需要立即处理`,
                severity: 'high'
            };
        }

        // 添加优先级建议
        if (report.issues.some(issue => issue.includes('token'))) {
            report.recommendations.unshift('🔥 最高优先级: 解决认证问题');
        } else if (report.issues.some(issue => issue.includes('无法访问'))) {
            report.recommendations.unshift('🔥 高优先级: 检查后端服务状态');
        } else if (report.issues.some(issue => issue.includes('全为0'))) {
            report.recommendations.unshift('📊 中优先级: 检查数据源和业务逻辑');
        }

        console.log(`📋 诊断总结: ${report.summary.message}`);
    }
}

// 导出诊断函数
export const runQuickDiagnostic = async () => {
    const diagnostic = new QuickDiagnostic();
    return await diagnostic.runDiagnostic();
};

export default QuickDiagnostic;