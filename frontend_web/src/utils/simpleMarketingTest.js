// 简单的营销API测试工具
console.log('🚀 开始营销API连通性测试...');

// 检查基本配置
const checkConfig = () => {
    console.log('📋 检查基本配置:');
    console.log('- Token存在:', !!localStorage.getItem('adminToken'));
    console.log('- 当前URL:', window.location.href);
    console.log('- API Base:', import.meta.env.VITE_API_BASE_URL || '默认');
};

// 直接使用fetch测试API
const testWithFetch = async () => {
    console.log('\n🌐 使用fetch直接测试...');
    
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const testPaths = [
        'http://localhost:8082/coupons/health',
        'http://localhost:8082/api/admin/coupons/templates',
        'http://localhost:8082/coupons/templates',
        '/api/admin/coupons/templates',
        '/coupons/templates'
    ];
    
    for (const path of testPaths) {
        try {
            console.log(`\n📡 测试: ${path}`);
            const response = await fetch(path, { headers });
            const data = await response.text();
            
            console.log(`✅ 状态: ${response.status}`);
            console.log(`📦 响应: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
            
            if (response.ok) {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`📊 JSON解析成功, 类型: ${typeof jsonData}, 数组: ${Array.isArray(jsonData)}`);
                    if (Array.isArray(jsonData)) {
                        console.log(`📈 数组长度: ${jsonData.length}`);
                    } else if (jsonData && typeof jsonData === 'object') {
                        console.log(`📝 对象键: [${Object.keys(jsonData).join(', ')}]`);
                    }
                } catch (e) {
                    console.log(`⚠️ 非JSON响应`);
                }
                
                // 找到第一个工作的就返回
                return { success: true, path, data };
            }
        } catch (error) {
            console.log(`❌ 错误: ${error.message}`);
        }
    }
    
    return { success: false };
};

// 运行测试
const runTest = async () => {
    checkConfig();
    const result = await testWithFetch();
    
    if (result.success) {
        console.log(`\n🎉 找到可用的API: ${result.path}`);
        return result;
    } else {
        console.log('\n💥 所有API路径都失败了');
        console.log('\n💡 可能的问题:');
        console.log('1. 营销服务(8082端口)未运行');
        console.log('2. CORS配置问题');
        console.log('3. 认证Token无效');
        console.log('4. API端点未实现');
        return null;
    }
};

// 导出到全局，方便在控制台调用
window.testMarketingConnection = runTest;

// 自动运行一次
runTest().then(result => {
    if (result) {
        console.log('\n🔧 建议: 在营销页面中使用路径:', result.path);
    }
});

export default runTest;