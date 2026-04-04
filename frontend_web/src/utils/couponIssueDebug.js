// 优惠券发放调试工具
import { marketingApi } from '../services/admin/apiConfig.js';

export const debugCouponIssue = {
    // 检查后端服务连接状态
    async checkBackendConnection() {
        console.log('🔍 检查后端服务连接状态...');

        try {
            // 检查 Marketing Service 是否可用
            const response = await fetch('http://localhost:8082/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Marketing Service (8082) 状态:', response.status, response.statusText);
            return true;
        } catch (error) {
            console.error('❌ Marketing Service (8082) 连接失败:', error.message);
            console.log('💡 请确认后端 Marketing Service 是否在 8082 端口运行');
            return false;
        }
    },

    // 检查API路径
    async testApiPath(issueData) {
        console.log('🔍 测试API路径...');
        console.log('📤 发送数据:', issueData);

        try {
            // 尝试直接调用API
            const response = await marketingApi.post('/api/coupons/admin/issue', issueData);
            console.log('✅ API调用成功:', response.data);
            return response;
        } catch (error) {
            console.error('❌ API调用失败:', error);

            if (error.response) {
                console.log('📥 服务器响应:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.log('📡 请求未收到响应:', error.request);
            } else {
                console.log('⚠️ 请求配置错误:', error.message);
            }

            throw error;
        }
    },

    // 检查请求头
    checkAuthHeaders() {
        const token = localStorage.getItem('adminToken');
        console.log('🔑 认证token状态:');
        console.log('- Token存在:', !!token);
        if (token) {
            console.log('- Token前缀:', token.substring(0, 20) + '...');
            console.log('- Token长度:', token.length);
        }
        return !!token;
    },

    // 验证发放数据格式
    validateIssueData(issueData) {
        console.log('✅ 验证发放数据格式...');
        console.log('📋 数据内容:', issueData);

        const required = ['couponTemplateId', 'userId', 'remark'];
        const missing = required.filter(field => !issueData[field]);

        if (missing.length > 0) {
            console.error('❌ 缺少必填字段:', missing);
            return false;
        }

        // 检查数据类型
        if (typeof issueData.couponTemplateId !== 'number') {
            console.warn('⚠️ couponTemplateId应为数字类型，当前为:', typeof issueData.couponTemplateId);
        }

        if (typeof issueData.userId !== 'number') {
            console.warn('⚠️ userId应为数字类型，当前为:', typeof issueData.userId);
        }

        console.log('✅ 数据格式验证通过');
        return true;
    },

    // 完整的调试流程
    async fullDiagnosis(issueData) {
        console.log('🚀 开始优惠券发放诊断...');
        console.log('==========================================');

        // 检查认证
        if (!this.checkAuthHeaders()) {
            console.error('❌ 未找到认证token，请先登录');
            return false;
        }

        // 验证数据
        if (!this.validateIssueData(issueData)) {
            console.error('❌ 数据验证失败');
            return false;
        }

        // 检查后端连接
        const backendOk = await this.checkBackendConnection();
        if (!backendOk) {
            console.error('❌ 后端服务连接失败');
            return false;
        }

        // 测试API调用
        try {
            await this.testApiPath(issueData);
            console.log('🎉 诊断完成：所有检查都通过！');
            return true;
        } catch (error) {
            console.error('❌ 诊断完成：API调用失败');
            return false;
        }
    }
};

// 在控制台中可用的快捷调试函数
window.debugCouponIssue = debugCouponIssue;