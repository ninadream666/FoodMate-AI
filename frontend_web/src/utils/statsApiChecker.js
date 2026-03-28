/**
 * 统计数据API状态检查工具
 * 专门用于检查各页面统计数据接口的可用性
 */

import { platformApi, orderApi, userApi, merchantApi } from '../services/admin/apiConfig';

class StatsApiChecker {
    async checkAllStatsApis() {
        console.log('🔍 开始检查所有统计数据API...');

        const results = {
            dashboard: await this.checkDashboardApi(),
            orders: await this.checkOrdersStatsApi(),
            users: await this.checkUsersStatsApi(),
            merchants: await this.checkMerchantsApi()
        };

        console.log('📊 所有API检查完成:', results);
        return results;
    }

    // 检查Dashboard API
    async checkDashboardApi() {
        console.log('🎯 检查Dashboard API...');
        try {
            const response = await platformApi.get('/api/admin/dashboard/overview');
            console.log('✅ Dashboard API响应成功:', response.data);

            return {
                status: 'success',
                data: response.data,
                hasExpectedFields: this.validateDashboardData(response.data)
            };
        } catch (error) {
            console.error('❌ Dashboard API失败:', error);
            return {
                status: 'failed',
                error: error.message,
                httpStatus: error.originalError?.response?.status
            };
        }
    }

    // 检查Orders统计API
    async checkOrdersStatsApi() {
        console.log('📦 检查Orders统计API...');
        try {
            const response = await orderApi.get('/api/admin/orders/stats');
            console.log('✅ Orders统计API响应成功:', response.data);

            return {
                status: 'success',
                data: response.data,
                hasExpectedFields: this.validateOrdersStatsData(response.data)
            };
        } catch (error) {
            console.error('❌ Orders统计API失败:', error);
            return {
                status: 'failed',
                error: error.message,
                httpStatus: error.originalError?.response?.status
            };
        }
    }

    // 检查Users统计API
    async checkUsersStatsApi() {
        console.log('👥 检查Users统计API...');
        try {
            const response = await userApi.get('/admin/users/stats');
            console.log('✅ Users统计API响应成功:', response.data);

            return {
                status: 'success',
                data: response.data,
                hasExpectedFields: this.validateUsersStatsData(response.data)
            };
        } catch (error) {
            console.error('❌ Users统计API失败:', error);
            return {
                status: 'failed',
                error: error.message,
                httpStatus: error.originalError?.response?.status
            };
        }
    }

    // 检查Merchants API (目前没有统计接口，只检查列表)
    async checkMerchantsApi() {
        console.log('🏪 检查Merchants API...');
        try {
            const response = await merchantApi.get('/api/admin/merchants?page=0&size=1');
            console.log('✅ Merchants API响应成功:', response.data);

            return {
                status: 'success',
                data: response.data,
                note: '商家管理页面暂无专门的统计接口'
            };
        } catch (error) {
            console.error('❌ Merchants API失败:', error);
            return {
                status: 'failed',
                error: error.message,
                httpStatus: error.originalError?.response?.status
            };
        }
    }

    // 验证Dashboard数据结构
    validateDashboardData(data) {
        const expectedFields = [
            'totalRevenue', 'totalSales',
            'totalUserCount', 'userCount',
            'totalMerchantCount', 'activeMerchantCount', 'merchantCount',
            'todayOrderCount', 'orderCount'
        ];

        const presentFields = expectedFields.filter(field =>
            data[field] !== undefined && data[field] !== null
        );

        console.log('Dashboard数据字段分析:', {
            期望字段: expectedFields,
            实际字段: Object.keys(data),
            匹配字段: presentFields
        });

        return {
            expectedFields,
            presentFields,
            coverage: presentFields.length / expectedFields.length,
            hasAnyRevenueField: data.totalRevenue !== undefined || data.totalSales !== undefined,
            hasAnyUserField: data.totalUserCount !== undefined || data.userCount !== undefined,
            hasAnyMerchantField: data.totalMerchantCount !== undefined || data.activeMerchantCount !== undefined || data.merchantCount !== undefined,
            hasAnyOrderField: data.todayOrderCount !== undefined || data.orderCount !== undefined
        };
    }

    // 验证Orders统计数据结构
    validateOrdersStatsData(data) {
        const expectedFields = [
            'totalOrders', 'pendingOrders', 'completedOrders', 'totalRevenue'
        ];

        const presentFields = expectedFields.filter(field =>
            data[field] !== undefined && data[field] !== null
        );

        console.log('Orders统计数据字段分析:', {
            期望字段: expectedFields,
            实际字段: Object.keys(data),
            匹配字段: presentFields
        });

        return {
            expectedFields,
            presentFields,
            coverage: presentFields.length / expectedFields.length
        };
    }

    // 验证Users统计数据结构
    validateUsersStatsData(data) {
        const expectedFields = [
            'totalUsers', 'activeUsers', 'bannedUsers',
            'excellentUsers', 'normalUsers', 'poorUsers'
        ];

        const presentFields = expectedFields.filter(field =>
            data[field] !== undefined && data[field] !== null
        );

        console.log('Users统计数据字段分析:', {
            期望字段: expectedFields,
            实际字段: Object.keys(data),
            匹配字段: presentFields
        });

        return {
            expectedFields,
            presentFields,
            coverage: presentFields.length / expectedFields.length
        };
    }

    // 生成检查报告
    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 4,
                success: 0,
                failed: 0
            },
            details: {},
            recommendations: []
        };

        // 统计成功失败数量
        Object.entries(results).forEach(([service, result]) => {
            if (result.status === 'success') {
                report.summary.success++;
            } else {
                report.summary.failed++;
            }

            report.details[service] = result;
        });

        // 生成建议
        if (report.summary.failed === report.summary.total) {
            report.recommendations.push('🔴 所有统计API都失败了，请检查后端服务是否启动');
        } else if (report.summary.failed > 0) {
            report.recommendations.push(`🟡 有${report.summary.failed}个API失败，请检查具体服务`);
        } else {
            report.recommendations.push('🟢 所有API都正常，问题可能在数据处理层');
        }

        // 具体服务建议
        if (results.dashboard.status === 'failed') {
            report.recommendations.push('💡 Dashboard API失败 - 检查Platform Service (8088端口)');
        } else if (results.dashboard.data && Object.values(results.dashboard.data).every(v => v === 0)) {
            report.recommendations.push('⚠️ Dashboard API返回的数据全为0 - 可能是Platform Service聚合逻辑问题');
        }

        if (results.orders.status === 'failed') {
            report.recommendations.push('💡 Orders API失败 - 检查Order Service (8084端口)');
        }

        if (results.users.status === 'failed') {
            report.recommendations.push('💡 Users API失败 - 检查User Service (8083端口)');
        }

        if (results.merchants.status === 'failed') {
            report.recommendations.push('💡 Merchants API失败 - 检查Merchant Service (8081端口)');
        }

        console.log('📋 统计API检查报告:', report);
        return report;
    }
}

const statsApiChecker = new StatsApiChecker();

// 导出方法
export const checkStatsApis = async () => {
    const results = await statsApiChecker.checkAllStatsApis();
    return statsApiChecker.generateReport(results);
};

export default statsApiChecker;