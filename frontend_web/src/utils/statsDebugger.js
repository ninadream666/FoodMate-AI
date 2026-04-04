/**
 * 统计数据调试工具
 * 在浏览器控制台运行以测试统计接口
 */

// 直接测试各个统计接口
const testStatsApis = async () => {
    console.log('🔍 开始测试所有统计接口...');

    const results = {};

    // 测试Dashboard统计
    try {
        console.log('📊 测试Dashboard统计接口...');
        const dashboardResponse = await fetch('/api/admin/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            results.dashboard = { success: true, data: dashboardData };
            console.log('✅ Dashboard数据:', dashboardData);
        } else {
            results.dashboard = { success: false, status: dashboardResponse.status, error: await dashboardResponse.text() };
            console.error('❌ Dashboard请求失败:', dashboardResponse.status);
        }
    } catch (error) {
        results.dashboard = { success: false, error: error.message };
        console.error('❌ Dashboard请求异常:', error);
    }

    // 测试Orders统计
    try {
        console.log('📦 测试Orders统计接口...');
        const ordersResponse = await fetch('/api/admin/orders/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            results.orders = { success: true, data: ordersData };
            console.log('✅ Orders数据:', ordersData);
        } else {
            results.orders = { success: false, status: ordersResponse.status, error: await ordersResponse.text() };
            console.error('❌ Orders请求失败:', ordersResponse.status);
        }
    } catch (error) {
        results.orders = { success: false, error: error.message };
        console.error('❌ Orders请求异常:', error);
    }

    // 测试Users统计
    try {
        console.log('👥 测试Users统计接口...');
        const usersResponse = await fetch('/admin/users/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            results.users = { success: true, data: usersData };
            console.log('✅ Users数据:', usersData);
        } else {
            results.users = { success: false, status: usersResponse.status, error: await usersResponse.text() };
            console.error('❌ Users请求失败:', usersResponse.status);
        }
    } catch (error) {
        results.users = { success: false, error: error.message };
        console.error('❌ Users请求异常:', error);
    }

    // 测试Merchants统计
    try {
        console.log('🏪 测试Merchants统计接口...');
        const merchantsResponse = await fetch('/api/admin/merchants/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (merchantsResponse.ok) {
            const merchantsData = await merchantsResponse.json();
            results.merchants = { success: true, data: merchantsData };
            console.log('✅ Merchants数据:', merchantsData);
        } else {
            results.merchants = { success: false, status: merchantsResponse.status, error: await merchantsResponse.text() };
            console.error('❌ Merchants请求失败:', merchantsResponse.status);
        }
    } catch (error) {
        results.merchants = { success: false, error: error.message };
        console.error('❌ Merchants请求异常:', error);
    }

    // 总结报告
    console.log('📋 统计接口测试完成:');
    console.table(results);

    const successCount = Object.values(results).filter(r => r.success).length;
    console.log(`🎯 成功: ${successCount}/4, 失败: ${4 - successCount}/4`);

    return results;
};

// 测试认证状态
const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    console.log('🔐 认证状态检查:');
    console.log('Token存在:', !!token);
    console.log('Token长度:', token?.length);
    console.log('User存在:', !!user);

    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('用户信息:', userData);
        } catch (e) {
            console.error('用户信息解析失败:', e);
        }
    }
};

// 导出到全局
window.testStatsApis = testStatsApis;
window.checkAuth = checkAuth;

console.log('🛠️ 统计数据调试工具已加载!');
console.log('使用方法:');
console.log('  testStatsApis() - 测试所有统计接口');
console.log('  checkAuth() - 检查认证状态');