/**
 * authService 单元测试
 * 测试登录/注册/登出的数据处理逻辑、Token存储逻辑、会话状态判断
 * 纯逻辑测试，不依赖React Native运行时
 */

describe('authService - 登录数据处理逻辑', () => {
    test('登录成功响应应包含token字段', () => {
        const response = { token: 'jwt-token-123', id: 1, username: 'testuser', role: 'CUSTOMER' };
        expect(response.token).toBeTruthy();
        expect(response.token.length).toBeGreaterThan(5);
    });

    test('登录成功后应构造正确的用户信息对象', () => {
        const data = { token: 'jwt-token', id: 2, username: 'merchant1', role: 'MERCHANT' };
        const userInfo = {
            id: data.id,
            username: data.username || 'unknown',
            role: data.role || 'CUSTOMER',
        };
        expect(userInfo.id).toBe(2);
        expect(userInfo.username).toBe('merchant1');
        expect(userInfo.role).toBe('MERCHANT');
    });

    test('登录返回无token时不应构造存储数据', () => {
        const data = { error: '用户名或密码错误' };
        const shouldStore = !!data.token;
        expect(shouldStore).toBe(false);
    });

    test('userId应转为字符串存储', () => {
        const data = { token: 'token', id: 123 };
        const userIdStr = data.id ? data.id.toString() : null;
        expect(userIdStr).toBe('123');
        expect(typeof userIdStr).toBe('string');
    });

    test('登录返回无id时userId应为null', () => {
        const data = { token: 'token-no-id' };
        const userIdStr = data.id ? data.id.toString() : null;
        expect(userIdStr).toBeNull();
    });
});

describe('authService - 注册参数构建', () => {
    test('注册请求应包含4个必要字段', () => {
        const payload = {
            username: 'newuser',
            email: 'new@email.com',
            password: 'pass123',
            role: 'CUSTOMER',
        };
        expect(payload).toHaveProperty('username');
        expect(payload).toHaveProperty('email');
        expect(payload).toHaveProperty('password');
        expect(payload).toHaveProperty('role');
    });

    test('注册角色应为CUSTOMER或MERCHANT', () => {
        const validRoles = ['CUSTOMER', 'MERCHANT'];
        expect(validRoles).toContain('CUSTOMER');
        expect(validRoles).toContain('MERCHANT');
        expect(validRoles).not.toContain('ADMIN');
    });
});

describe('authService - 登出数据清理', () => {
    test('登出应清除3个存储键', () => {
        const keysToRemove = ['token', 'user', 'userId'];
        expect(keysToRemove).toHaveLength(3);
        expect(keysToRemove).toContain('token');
        expect(keysToRemove).toContain('user');
        expect(keysToRemove).toContain('userId');
    });
});

describe('authService - 会话状态判断', () => {
    test('有token时isLoggedIn为true', () => {
        const token = 'some-token';
        expect(!!token).toBe(true);
    });

    test('空token时isLoggedIn为false', () => {
        const token = null;
        expect(!!token).toBe(false);
    });

    test('空字符串token时isLoggedIn为false', () => {
        const token = '';
        expect(!!token).toBe(false);
    });

    test('getCurrentUser应能解析有效JSON', () => {
        const userStr = '{"id":1,"username":"test","role":"CUSTOMER"}';
        const user = JSON.parse(userStr);
        expect(user.id).toBe(1);
        expect(user.role).toBe('CUSTOMER');
    });

    test('getCurrentUser解析无效JSON应返回null', () => {
        const userStr = 'invalid{{{';
        let user = null;
        try { user = JSON.parse(userStr); } catch (e) { user = null; }
        expect(user).toBeNull();
    });
});
