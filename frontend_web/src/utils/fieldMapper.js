/**
 * 字段映射调试工具
 * 分析后端API返回的实际字段并生成正确的映射代码
 */

// 测试并分析字段映射
async function analyzeFieldMapping() {
    console.log('🔍 开始分析字段映射...');

    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('❌ 未找到认证token');
        return;
    }

    const results = {};

    // 测试Dashboard API
    try {
        console.log('\n📊 测试Dashboard API...');
        const response = await fetch('http://localhost:8088/admin/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            results.dashboard = data;
            console.log('✅ Dashboard原始数据:', data);
            console.log('📋 Dashboard字段分析:', {
                allFields: Object.keys(data),
                numericFields: Object.entries(data).filter(([k, v]) => typeof v === 'number'),
                nonZeroFields: Object.entries(data).filter(([k, v]) => v !== 0 && v !== null && v !== undefined)
            });
        }
    } catch (error) {
        console.error('❌ Dashboard API错误:', error);
    }

    // 测试Orders API
    try {
        console.log('\n📦 测试Orders API...');
        const response = await fetch('http://localhost:8084/admin/orders/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            results.orders = data;
            console.log('✅ Orders原始数据:', data);
            console.log('📋 Orders字段分析:', {
                allFields: Object.keys(data),
                numericFields: Object.entries(data).filter(([k, v]) => typeof v === 'number'),
                nonZeroFields: Object.entries(data).filter(([k, v]) => v !== 0 && v !== null && v !== undefined)
            });
        }
    } catch (error) {
        console.error('❌ Orders API错误:', error);
    }

    // 测试Users API
    try {
        console.log('\n👥 测试Users API...');
        const response = await fetch('http://localhost:8083/admin/users/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            results.users = data;
            console.log('✅ Users原始数据:', data);
            console.log('📋 Users字段分析:', {
                allFields: Object.keys(data),
                numericFields: Object.entries(data).filter(([k, v]) => typeof v === 'number'),
                nonZeroFields: Object.entries(data).filter(([k, v]) => v !== 0 && v !== null && v !== undefined)
            });
        }
    } catch (error) {
        console.error('❌ Users API错误:', error);
    }

    // 测试Merchants API
    try {
        console.log('\n🏪 测试Merchants API...');
        const response = await fetch('http://localhost:8081/admin/merchants/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            results.merchants = data;
            console.log('✅ Merchants原始数据:', data);
            console.log('📋 Merchants字段分析:', {
                allFields: Object.keys(data),
                numericFields: Object.entries(data).filter(([k, v]) => typeof v === 'number'),
                nonZeroFields: Object.entries(data).filter(([k, v]) => v !== 0 && v !== null && v !== undefined)
            });
        }
    } catch (error) {
        console.error('❌ Merchants API错误:', error);
    }

    // 生成修复建议
    console.log('\n🔧 修复建议:');
    generateFixSuggestions(results);

    return results;
}

// 生成修复建议
function generateFixSuggestions(results) {
    if (results.dashboard) {
        const data = results.dashboard;
        console.log('\n📊 Dashboard修复建议:');
        console.log(`totalSales: ${data.totalRevenue !== undefined ? 'data.totalRevenue' : data.totalSales !== undefined ? 'data.totalSales' : '0'} (当前值: ${data.totalRevenue || data.totalSales || 0})`);
        console.log(`newUsers: ${data.totalUserCount !== undefined ? 'data.totalUserCount' : data.userCount !== undefined ? 'data.userCount' : '0'} (当前值: ${data.totalUserCount || data.userCount || 0})`);
        console.log(`activeMerchants: ${data.activeMerchantCount !== undefined ? 'data.activeMerchantCount' : data.merchantCount !== undefined ? 'data.merchantCount' : '0'} (当前值: ${data.activeMerchantCount || data.merchantCount || 0})`);
        console.log(`todayOrders: ${data.todayOrderCount !== undefined ? 'data.todayOrderCount' : data.orderCount !== undefined ? 'data.orderCount' : '0'} (当前值: ${data.todayOrderCount || data.orderCount || 0})`);
    }

    if (results.orders) {
        const data = results.orders;
        console.log('\n📦 Orders修复建议:');
        console.log(`totalOrders: ${data.totalCount !== undefined ? 'data.totalCount' : data.totalOrders !== undefined ? 'data.totalOrders' : '0'} (当前值: ${data.totalCount || data.totalOrders || 0})`);
        console.log(`pendingOrders: ${data.pendingCount !== undefined ? 'data.pendingCount' : data.pendingOrders !== undefined ? 'data.pendingOrders' : '0'} (当前值: ${data.pendingCount || data.pendingOrders || 0})`);
        console.log(`completedOrders: ${data.completedCount !== undefined ? 'data.completedCount' : data.completedOrders !== undefined ? 'data.completedOrders' : '0'} (当前值: ${data.completedCount || data.completedOrders || 0})`);
        console.log(`totalRevenue: ${data.totalRevenue !== undefined ? 'data.totalRevenue' : data.revenue !== undefined ? 'data.revenue' : '0'} (当前值: ${data.totalRevenue || data.revenue || 0})`);
    }

    if (results.users) {
        const data = results.users;
        console.log('\n👥 Users修复建议:');
        console.log(`totalUsers: ${data.totalCount !== undefined ? 'data.totalCount' : data.totalUsers !== undefined ? 'data.totalUsers' : '0'} (当前值: ${data.totalCount || data.totalUsers || 0})`);
        console.log(`activeUsers: ${data.activeCount !== undefined ? 'data.activeCount' : data.activeUsers !== undefined ? 'data.activeUsers' : '0'} (当前值: ${data.activeCount || data.activeUsers || 0})`);
    }

    if (results.merchants) {
        const data = results.merchants;
        console.log('\n🏪 Merchants修复建议:');
        console.log(`totalMerchants: ${data.totalCount !== undefined ? 'data.totalCount' : data.total !== undefined ? 'data.total' : '0'} (当前值: ${data.totalCount || data.total || 0})`);
        console.log(`activeMerchants: ${data.activeCount !== undefined ? 'data.activeCount' : data.active !== undefined ? 'data.active' : '0'} (当前值: ${data.activeCount || data.active || 0})`);
    }
}

// 绑定到window供控制台调用
window.analyzeFieldMapping = analyzeFieldMapping;

console.log('🔧 字段映射分析工具已加载！');
console.log('💡 使用方法: analyzeFieldMapping()');

export { analyzeFieldMapping };