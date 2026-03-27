// API 连接调试工具
import { merchantApi, userApi } from '../services/admin/apiConfig';

class ApiConnectionDebugger {
    constructor() {
        this.results = {
            tokenStatus: null,
            userApiConnection: null,
            merchantApiConnection: null,
            lastError: null
        };
    }

    // 检查Token状态
    checkTokenStatus() {
        const token = localStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser');

        this.results.tokenStatus = {
            hasToken: !!token,
            hasUser: !!user,
            tokenLength: token ? token.length : 0,
            tokenPrefix: token ? token.substring(0, 20) + '...' : null,
            user: user ? JSON.parse(user) : null,
            isExpired: this.isTokenExpired(token)
        };

        console.log('🔐 Token检查结果:', this.results.tokenStatus);
        return this.results.tokenStatus;
    }

    // 检查Token是否过期
    isTokenExpired(token) {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp && payload.exp < now;
        } catch (error) {
            console.warn('Token格式无效:', error);
            return true;
        }
    }

    // 测试用户服务API连接
    async testUserApiConnection() {
        try {
            console.log('🧪 测试用户服务连接...');
            const response = await userApi.get('/admin/users?page=0&size=1');

            this.results.userApiConnection = {
                success: true,
                status: response.status,
                data: response.data,
                headers: response.headers
            };

            console.log('✅ 用户服务连接成功:', this.results.userApiConnection);
        } catch (error) {
            this.results.userApiConnection = {
                success: false,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            };

            console.error('❌ 用户服务连接失败:', this.results.userApiConnection);
        }

        return this.results.userApiConnection;
    }

    // 测试商家服务API连接
    async testMerchantApiConnection() {
        try {
            console.log('🧪 测试商家服务连接...');
            const response = await merchantApi.get('/api/admin/merchants?page=0&size=1');

            this.results.merchantApiConnection = {
                success: true,
                status: response.status,
                data: response.data,
                headers: response.headers
            };

            console.log('✅ 商家服务连接成功:', this.results.merchantApiConnection);
        } catch (error) {
            this.results.merchantApiConnection = {
                success: false,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            };

            console.error('❌ 商家服务连接失败:', this.results.merchantApiConnection);
        }

        return this.results.merchantApiConnection;
    }

    // 运行完整诊断
    async runFullDiagnostic() {
        console.log('🚀 开始API连接诊断...');

        // 检查Token
        this.checkTokenStatus();

        // 测试API连接
        await Promise.all([
            this.testUserApiConnection(),
            this.testMerchantApiConnection()
        ]);

        // 生成诊断报告
        const report = this.generateDiagnosticReport();
        console.log('📊 诊断报告:', report);

        return report;
    }

    // 生成诊断报告
    generateDiagnosticReport() {
        const { tokenStatus, userApiConnection, merchantApiConnection } = this.results;

        const report = {
            summary: {
                overallHealth: 'unknown',
                issues: [],
                recommendations: []
            },
            details: {
                tokenStatus,
                userApiConnection,
                merchantApiConnection
            }
        };

        // 分析Token状态
        if (!tokenStatus.hasToken) {
            report.summary.issues.push('缺少认证Token');
            report.summary.recommendations.push('请重新登录获取Token');
        } else if (tokenStatus.isExpired) {
            report.summary.issues.push('Token已过期');
            report.summary.recommendations.push('请重新登录刷新Token');
        }

        // 分析API连接状态
        if (!userApiConnection.success) {
            report.summary.issues.push('用户服务连接失败');
            report.summary.recommendations.push('检查用户服务(8083端口)是否正常运行');
        }

        if (!merchantApiConnection.success) {
            report.summary.issues.push('商家服务连接失败');
            report.summary.recommendations.push('检查商家服务(8081端口)是否正常运行');
        }

        // 确定总体健康状态
        if (report.summary.issues.length === 0) {
            report.summary.overallHealth = 'healthy';
        } else if (report.summary.issues.length <= 2) {
            report.summary.overallHealth = 'warning';
        } else {
            report.summary.overallHealth = 'critical';
        }

        return report;
    }

    // 获取建议的修复步骤
    getFixSuggestions() {
        const report = this.generateDiagnosticReport();
        return report.summary.recommendations;
    }
}

// 导出调试器实例
const apiDebugger = new ApiConnectionDebugger();

// 导出便捷方法
export const debugApiConnection = () => apiDebugger.runFullDiagnostic();
export const checkTokenStatus = () => apiDebugger.checkTokenStatus();
export const testUserApi = () => apiDebugger.testUserApiConnection();
export const testMerchantApi = () => apiDebugger.testMerchantApiConnection();

export default apiDebugger;