import axios from 'axios';

class AuthService {
    /**
     * 从JWT Token中解析用户信息
     * JWT格式: header.payload.signature
     */
    parseTokenPayload(token) {
        try {
            if (!token || !token.includes('.')) {
                return null;
            }
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('JWT Payload 解析成功:', payload);
            return payload;
        } catch (error) {
            console.error('JWT 解析失败:', error);
            return null;
        }
    }

    // 管理员登录
    async login(username, password) {
        try {
            console.log('尝试连接后端服务...');

            const response = await axios.post('/api/auth/login', {
                username,
                password,
                role: 'admin'  // 指定管理员角色
            });

            const { data } = response;
            console.log('后端登录响应:', data);

            // 存储认证信息
            if (data?.token) {
                // 保存Token
                localStorage.setItem('adminToken', data.token);

                // 尝试从JWT Token中解析用户信息
                const tokenPayload = this.parseTokenPayload(data.token);

                // 构建用户信息。优先使用响应数据，其次使用JWT payload，最后使用默认值
                const userInfo = {
                    id: data.id || data.userId || tokenPayload?.userId || tokenPayload?.sub || 1,
                    username: data.username || tokenPayload?.username || tokenPayload?.sub || username,
                    role: data.role || tokenPayload?.role || 'admin',
                    nickname: data.nickname || tokenPayload?.nickname || username,
                    email: data.email || tokenPayload?.email || ''
                };

                localStorage.setItem('adminUser', JSON.stringify(userInfo));

                console.log('登录成功，用户信息:', userInfo);
                return { ...data, ...userInfo, token: data.token };
            }

            // 如果没有token，抛出错误
            throw new Error('登录响应中没有 token');
        } catch (error) {
            console.error('后端登录失败:', error);

            // 提供更详细的错误信息
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.error;

                if (status === 401) {
                    throw new Error('用户名或密码错误');
                } else if (status === 403) {
                    throw new Error('账户权限不足或被禁用');
                } else {
                    throw new Error(message || `服务器错误 (${status})`);
                }
            } else if (error.code === 'ERR_NETWORK') {
                throw new Error('无法连接到服务器，请检查后端服务是否运行');
            }

            throw error;
        }
    }

    // 管理员注册
    async register(userData) {
        try {
            const response = await axios.post('/api/auth/register', {
                ...userData,
                role: 'admin' // 明确指定为管理员角色
            });
            return response.data;
        } catch (error) {
            console.error('Register failed:', error);
            throw error;
        }
    }

    // 登出
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        // 清除其他可能的缓存数据
        localStorage.removeItem('adminPermissions');
    }

    // 获取当前用户信息
    getCurrentUser() {
        const userStr = localStorage.getItem('adminUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    // 获取Token
    getToken() {
        return localStorage.getItem('adminToken');
    }

    // 检查是否已认证
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return !!(token && user && user.role === 'admin');
    }

    // 检查Token是否过期
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        try {
            // 解析JWT Token的payload部分
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            return payload.exp < now;
        } catch (error) {
            console.error('Error parsing token:', error);
            return true;
        }
    }

    // 自动刷新Token
    async refreshToken() {
        try {
            // 手动携带Token请求，绕过拦截器可能导致的路径错误
            const response = await axios.post('/api/auth/refresh', {}, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            const { token } = response.data;

            if (token) {
                localStorage.setItem('adminToken', token);
                return token;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            throw error;
        }
    }

    // 验证用户角色权限
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // 管理员具有所有权限
        if (user.role === 'admin') return true;

        return user.role === requiredRole;
    }

    // 验证具体权限
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // 管理员默认具有所有权限
        if (user.role === 'admin') return true;

        // 可以从localStorage或接口获取用户具体权限
        const permissions = JSON.parse(localStorage.getItem('adminPermissions') || '[]');
        return permissions.includes(permission);
    }
}

const authService = new AuthService();
export default authService;