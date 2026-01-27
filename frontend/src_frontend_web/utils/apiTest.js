// 快速测试优惠券发放API的脚本
async function testCouponIssueAPI() {
    console.log('🧪 测试优惠券发放API...');

    // 从localStorage获取token
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('❌ 未找到adminToken，请先在管理后台登录');
        return;
    }

    // 测试数据
    const testData = {
        couponTemplateId: 1,  // 请根据实际的模板ID调整
        userId: 1,            // 请根据实际的用户ID调整  
        remark: '测试发放'
    };

    console.log('📤 发送测试数据:', testData);
    console.log('🔑 使用Token:', token.substring(0, 20) + '...');

    try {
        // 测试1: 直接调用后端API
        console.log('\\n1️⃣ 直接测试后端API...');
        const directResponse = await fetch('http://localhost:8082/api/coupons/admin/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        console.log('📊 直接API响应状态:', directResponse.status, directResponse.statusText);

        if (!directResponse.ok) {
            const errorText = await directResponse.text();
            console.error('❌ 直接API调用失败:', errorText);
        } else {
            const successData = await directResponse.json();
            console.log('✅ 直接API调用成功:', successData);
        }

    } catch (error) {
        console.error('❌ API测试异常:', error);
    }

    try {
        // 测试2: 通过前端代理
        console.log('\\n2️⃣ 测试前端代理...');
        const proxyResponse = await fetch('/api/coupons/admin/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        console.log('📊 代理响应状态:', proxyResponse.status, proxyResponse.statusText);

        if (!proxyResponse.ok) {
            const errorText = await proxyResponse.text();
            console.error('❌ 代理调用失败:', errorText);
        } else {
            const successData = await proxyResponse.json();
            console.log('✅ 代理调用成功:', successData);
        }

    } catch (error) {
        console.error('❌ 代理测试异常:', error);
    }
}

// 测试前先检查当前可用的优惠券模板
async function checkAvailableTemplates() {
    console.log('📋 检查可用的优惠券模板...');

    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('❌ 未找到adminToken');
        return [];
    }

    try {
        const response = await fetch('/api/admin/coupons/templates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const templates = await response.json();
            console.log('✅ 可用模板:', templates);
            return templates;
        } else {
            console.error('❌ 获取模板失败:', response.status, await response.text());
            return [];
        }
    } catch (error) {
        console.error('❌ 检查模板异常:', error);
        return [];
    }
}

// 测试删除优惠券模板API
async function testDeleteTemplateAPI(templateId) {
    console.log('🧪 测试删除优惠券模板API...');

    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('❌ 未找到adminToken，请先在管理后台登录');
        return;
    }

    console.log('🗑️ 删除模板ID:', templateId);
    console.log('🔑 使用Token:', token.substring(0, 20) + '...');

    try {
        // 测试删除API
        console.log('\n1️⃣ 直接测试删除API...');
        const response = await fetch(`http://localhost:8082/api/admin/coupons/templates/${templateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📊 API响应状态:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 删除失败:', errorText);
        } else {
            const result = await response.json();
            console.log('✅ 删除成功:', result);
        }

    } catch (error) {
        console.error('❌ 删除测试异常:', error);
    }
}

// 在控制台中调用这些函数
console.log('💡 可用的测试函数:');
console.log('- testCouponIssueAPI() - 测试优惠券发放API');
console.log('- checkAvailableTemplates() - 检查可用的优惠券模板');
console.log('- testDeleteTemplateAPI(templateId) - 测试删除优惠券模板API');

window.testCouponIssueAPI = testCouponIssueAPI;
window.checkAvailableTemplates = checkAvailableTemplates;
window.testDeleteTemplateAPI = testDeleteTemplateAPI;