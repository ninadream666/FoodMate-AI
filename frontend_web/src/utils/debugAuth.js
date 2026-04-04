/**
 * 认证调试工具
 * 在浏览器控制台中使用：import('/src/utils/debugAuth.js').then(m => m.debugAuth())
 */

export const debugAuth = () => {
    console.log('=== 认证调试信息 ===');

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');

    console.log('Token:', token ? `${token.substring(0, 50)}...` : 'null');
    console.log('User:', user);
    console.log('UserId:', userId);

    if (token) {
        try {
            // 解析JWT token
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token Payload:', payload);

                // 检查过期时间
                if (payload.exp) {
                    const expDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    console.log('Token 过期时间:', expDate.toLocaleString());
                    console.log('Token 是否过期:', now > expDate ? '是 ❌' : '否 ✅');
                }
            }
        } catch (e) {
            console.log('无法解析 Token:', e.message);
        }
    }

    return { token, user, userId };
};

// 测试API调用
export const testApiCall = async (url, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`=== 测试 API 调用: ${method} ${url} ===`);
    console.log('Headers:', headers);
    if (body) console.log('Body:', body);

    try {
        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        console.log('Status:', response.status, response.statusText);

        const text = await response.text();
        console.log('Response:', text);

        return { status: response.status, data: text };
    } catch (e) {
        console.error('Error:', e);
        return { error: e.message };
    }
};

// 在全局暴露调试函数
if (typeof window !== 'undefined') {
    window.debugAuth = debugAuth;
    window.testApiCall = testApiCall;
    console.log('调试工具已加载。使用 debugAuth() 查看认证信息，testApiCall(url, method, body) 测试 API');
}
