// API连接调试和测试工具
import { marketingApi } from '../services/admin/apiConfig';

// 直接测试API调用
export const testMarketingApiDirectly = async () => {
    console.log('🧪 开始直接测试营销API调用...');
    console.log('━'.repeat(50));

    // 检查Token
    const token = localStorage.getItem('adminToken');
    console.log('🔑 Token状态:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在');

    // 测试不同的API路径
    const testPaths = [
        '/api/admin/coupons/templates',
        '/coupons/templates',
        '/api/coupons/templates',
        '/admin/coupons/templates'
    ];

    for (const path of testPaths) {
        try {
            console.log(`\n📡 测试路径: ${path}`);
            const response = await marketingApi.get(path);
            console.log(`✅ 成功! 状态: ${response.status}`);
            console.log(`📦 数据类型: ${typeof response.data}`);
            console.log(`📦 是否为数组: ${Array.isArray(response.data)}`);

            if (response.data) {
                if (Array.isArray(response.data)) {
                    console.log(`📊 数组长度: ${response.data.length}`);
                    if (response.data.length > 0) {
                        console.log(`📝 第一项: ${JSON.stringify(response.data[0]).substring(0, 100)}...`);
                    }
                } else if (typeof response.data === 'object') {
                    console.log(`📝 对象键: [${Object.keys(response.data).join(', ')}]`);
                    if (response.data.content) {
                        console.log(`📊 content长度: ${Array.isArray(response.data.content) ? response.data.content.length : '不是数组'}`);
                    }
                }
            }

            // 找到工作的路径就停止
            console.log(`🎉 找到工作的API路径: ${path}`);
            return { success: true, path, data: response.data };

        } catch (error) {
            console.log(`❌ 失败! 状态: ${error.response?.status || 'Network Error'}`);
            console.log(`💬 错误: ${error.response?.data?.message || error.message}`);
        }
    }

    console.log('\n❌ 所有API路径都失败了');
    return { success: false };
};

// 测试特定的管理员API
export const testAdminCouponsApi = async () => {
    console.log('🔧 测试管理员优惠券API...');

    try {
        // 测试健康检查
        console.log('🏥 测试健康检查...');
        const healthResponse = await marketingApi.get('/coupons/health');
        console.log('✅ 健康检查成功:', healthResponse.data);
    } catch (error) {
        console.error('❌ 健康检查失败:', error.response?.data || error.message);
    }

    try {
        // 测试管理员模板列表
        console.log('📋 测试管理员模板列表...');
        const response = await marketingApi.get('/api/admin/coupons/templates');
        console.log('✅ 管理员模板API成功!');
        console.log('📦 响应数据:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ 管理员模板API失败:');
        console.error('状态码:', error.response?.status);
        console.error('错误数据:', error.response?.data);
        console.error('完整错误:', error);

        // 尝试备用路径
        console.log('🔄 尝试备用路径...');
        try {
            const fallbackResponse = await marketingApi.get('/coupons/templates');
            console.log('✅ 备用路径成功!');
            console.log('📦 备用响应:', fallbackResponse.data);
            return fallbackResponse.data;
        } catch (fallbackError) {
            console.error('❌ 备用路径也失败:', fallbackError.response?.data);
            throw error;
        }
    }
};

// 检查后端API是否实现
export const checkBackendApiImplementation = async () => {
    console.log('🔍 检查后端API实现状态...');
    console.log('━'.repeat(50));

    const endpoints = [
        { name: '健康检查', path: '/coupons/health', method: 'GET' },
        { name: '管理员模板列表', path: '/api/admin/coupons/templates', method: 'GET' },
        { name: '普通模板列表', path: '/coupons/templates', method: 'GET' },
        { name: '管理员统计', path: '/api/admin/coupons/stats', method: 'GET' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🧪 测试: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);

            const response = await marketingApi({
                method: endpoint.method,
                url: endpoint.path
            });

            console.log(`✅ ${endpoint.name}: 成功 (${response.status})`);
            results.push({ ...endpoint, success: true, status: response.status, data: response.data });

        } catch (error) {
            const status = error.response?.status || 'Network';
            console.log(`❌ ${endpoint.name}: 失败 (${status})`);

            if (status === 404) {
                console.log('   → API端点未实现');
            } else if (status === 401) {
                console.log('   → 认证失败');
            } else if (status === 500) {
                console.log('   → 服务器内部错误');
            } else {
                console.log(`   → ${error.response?.data?.message || error.message}`);
            }

            results.push({ ...endpoint, success: false, status, error: error.message });
        }
    }

    console.log('\n📊 API实现状态总结:');
    console.log('━'.repeat(30));
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.success ? result.status : result.status}`);
    });

    return results;
};

export default {
    testMarketingApiDirectly,
    testAdminCouponsApi,
    checkBackendApiImplementation
};